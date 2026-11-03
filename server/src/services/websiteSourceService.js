import { createHash, randomUUID } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import mongoose from 'mongoose';
import { httpError } from '../middleware/errors.js';
import { WebsiteChunk } from '../models/WebsiteChunk.js';
import { WebsiteSource } from '../models/WebsiteSource.js';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_TEXT = 1_000_000;
const REFRESH_LOCK_MAX_AGE_MS = 2 * 60 * 1000;

function publicIPv4(address) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = octets;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168)) || (a === 198 && (b === 18 || b === 19)));
}

async function publicAddresses(hostname) {
  if (hostname.endsWith('.') || hostname.includes('%')) throw httpError(400, 'UNSAFE_URL', 'This website address is not allowed.');
  const version = isIP(hostname);
  if (version === 6) throw httpError(400, 'UNSAFE_URL', 'IPv6 website addresses are not supported.');
  const addresses = version === 4 ? [{ address: hostname, family: 4 }] : await lookup(hostname, { all: true, verbatim: true }).catch(() => []);
  if (!addresses.length || addresses.some(item => item.family !== 4 || !publicIPv4(item.address))) throw httpError(400, 'UNSAFE_URL', 'This website address resolves to a private or unavailable network.');
  return addresses;
}

function requestPage(url, address) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.request(url, {
      method: 'GET', timeout: 8_000, headers: { 'User-Agent': 'StudyRAG/1.0 (user-submitted study source)', Accept: 'text/html,application/xhtml+xml', 'Accept-Encoding': 'identity' },
      lookup: (_hostname, _options, callback) => callback(null, address.address, 4),
    }, response => {
      const status = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status)) { response.resume(); return resolve({ redirect: response.headers.location }); }
      if (status < 200 || status >= 300) { response.resume(); return reject(httpError(422, 'WEBSITE_FETCH_FAILED', 'The website did not return a readable page.')); }
      const type = String(response.headers['content-type'] || '').toLowerCase();
      if (!(type.includes('text/html') || type.includes('application/xhtml+xml'))) { response.resume(); return reject(httpError(415, 'WEBSITE_TYPE_UNSUPPORTED', 'Only public HTML webpages can be added.')); }
      const declared = Number(response.headers['content-length']);
      if (declared > MAX_BYTES) { response.destroy(); return reject(httpError(413, 'WEBSITE_TOO_LARGE', 'Webpages must be 2 MB or smaller.')); }
      const buffers = []; let size = 0;
      response.on('data', chunk => { size += chunk.length; if (size > MAX_BYTES) { response.destroy(); reject(httpError(413, 'WEBSITE_TOO_LARGE', 'Webpages must be 2 MB or smaller.')); } else buffers.push(chunk); });
      response.on('end', () => resolve({ body: Buffer.concat(buffers), type }));
      response.on('error', reject);
    });
    request.on('timeout', () => request.destroy(httpError(422, 'WEBSITE_TIMEOUT', 'The webpage took too long to load.')));
    request.on('error', reject);
    request.end();
  });
}

async function fetchPublicPage(input) {
  let url;
  try { url = new URL(input); } catch { throw httpError(400, 'INVALID_URL', 'Enter a valid public website URL.'); }
  for (let hop = 0; hop <= 3; hop += 1) {
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname) throw httpError(400, 'INVALID_URL', 'Use a public HTTP or HTTPS URL without sign-in details.');
    const addresses = await publicAddresses(url.hostname);
    const result = await requestPage(url, addresses[0]);
    if (!result.redirect) return { ...result, url };
    if (hop === 3) throw httpError(422, 'TOO_MANY_REDIRECTS', 'The webpage redirected too many times.');
    try { url = new URL(result.redirect, url); } catch { throw httpError(422, 'INVALID_REDIRECT', 'The website returned an invalid redirect.'); }
  }
  throw httpError(422, 'WEBSITE_FETCH_FAILED', 'Could not load this webpage.');
}

function decodeEntities(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
    if (entity[0] === '#') { const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ' '; }
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[entity.toLowerCase()] || match;
  });
}

function extractPage(html) {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]?.replace(/<[^>]*>/g, ' ') || '').replace(/\s+/g, ' ').trim().slice(0, 180);
  const text = decodeEntities(html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|svg|nav|footer|header)[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ').replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/article|\/section)[^>]*>/gi, '\n').replace(/<[^>]*>/g, ' '))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!text) throw httpError(422, 'EMPTY_WEBPAGE', 'No readable text was found on this webpage.');
  if (text.length > MAX_TEXT) throw httpError(413, 'WEBPAGE_TEXT_TOO_LARGE', 'This webpage contains too much text to index.');
  const chunks = []; let position = 0;
  while (position < text.length) { let end = Math.min(position + 1200, text.length); const boundary = text.lastIndexOf(' ', end); if (end < text.length && boundary > position + 700) end = boundary; const part = text.slice(position, end).trim(); if (part) chunks.push({ ordinal: chunks.length, text: part }); if (end >= text.length) break; position = Math.max(end - 120, position + 1); }
  return { title: title || 'Webpage', chunks };
}

const serialize = source => ({ id: String(source._id), url: source.url, title: source.title, canonicalHost: source.canonicalHost, status: source.status, chunkCount: source.chunkCount, fetchedAt: source.fetchedAt, createdAt: source.createdAt });

export async function listOwnedWebsiteSources(ownerId) {
  const items = await WebsiteSource.find({ ownerId }).sort({ createdAt: -1, _id: -1 }).limit(100).lean();
  return { items: items.map(serialize) };
}

export async function addOwnedWebsiteSource(ownerId, input) {
  const fetched = await fetchPublicPage(input);
  const parsed = extractPage(fetched.body.toString('utf8'));
  const url = fetched.url.toString().slice(0, 2048);
  const source = await WebsiteSource.create({ ownerId, url, title: parsed.title, canonicalHost: fetched.url.hostname, contentHash: createHash('sha256').update(fetched.body).digest('hex'), chunkCount: parsed.chunks.length, fetchedAt: new Date() });
  try { await WebsiteChunk.insertMany(parsed.chunks.map(chunk => ({ ...chunk, ownerId, sourceId: source._id })), { ordered: true }); }
  catch (error) { await WebsiteSource.deleteOne({ ownerId, _id: source._id }); throw error; }
  return serialize(source);
}

export async function deleteOwnedWebsiteSource(ownerId, id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'INVALID_ID', 'The website source ID is invalid.');
  const source = await WebsiteSource.findOneAndDelete({ _id: id, ownerId, $or: [{ refreshLock: null }, { refreshLockAt: { $lt: new Date(Date.now() - REFRESH_LOCK_MAX_AGE_MS) } }] });
  if (!source) {
    if (await WebsiteSource.exists({ _id: id, ownerId })) throw httpError(409, 'SOURCE_REFRESHING', 'Wait for the webpage refresh to finish before removing it.');
    throw httpError(404, 'SOURCE_NOT_FOUND', 'Website source not found.');
  }
  await WebsiteChunk.deleteMany({ ownerId, sourceId: source._id });
  return { success: true };
}

export async function refreshOwnedWebsiteSource(ownerId, id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'INVALID_ID', 'The website source ID is invalid.');
  const lock = randomUUID();
  const availableLock = { $or: [{ refreshLock: null }, { refreshLockAt: { $lt: new Date(Date.now() - REFRESH_LOCK_MAX_AGE_MS) } }] };
  const source = await WebsiteSource.findOneAndUpdate({ _id: id, ownerId, ...availableLock }, { $set: { refreshLock: lock, refreshLockAt: new Date() } }, { new: true }).select('+refreshLock');
  if (!source) {
    if (await WebsiteSource.exists({ _id: id, ownerId })) throw httpError(409, 'SOURCE_REFRESHING', 'This webpage is already being refreshed.');
    throw httpError(404, 'SOURCE_NOT_FOUND', 'Website source not found.');
  }
  let oldChunks;
  try {
    // Fetch and parse completely before touching the currently indexed passages.
    const fetched = await fetchPublicPage(source.url);
    const parsed = extractPage(fetched.body.toString('utf8'));
    oldChunks = await WebsiteChunk.find({ ownerId, sourceId: source._id }).lean();
    await WebsiteChunk.deleteMany({ ownerId, sourceId: source._id });
    await WebsiteChunk.insertMany(parsed.chunks.map(chunk => ({ ...chunk, ownerId, sourceId: source._id })), { ordered: true });
    const updated = await WebsiteSource.findOneAndUpdate({ _id: id, ownerId, refreshLock: lock }, { $set: {
      url: fetched.url.toString().slice(0, 2048), title: parsed.title, canonicalHost: fetched.url.hostname,
      contentHash: createHash('sha256').update(fetched.body).digest('hex'), chunkCount: parsed.chunks.length, fetchedAt: new Date(),
    }, $unset: { refreshLock: 1, refreshLockAt: 1 } }, { new: true, runValidators: true });
    if (!updated) throw httpError(409, 'SOURCE_REFRESH_INTERRUPTED', 'The webpage refresh was interrupted. Please reload your sources and try again.');
    return serialize(updated);
  } catch (error) {
    try {
      if (oldChunks) {
        await WebsiteChunk.deleteMany({ ownerId, sourceId: source._id });
        if (oldChunks.length) await WebsiteChunk.insertMany(oldChunks, { ordered: true });
      }
      await WebsiteSource.updateOne({ _id: id, ownerId, refreshLock: lock }, { $unset: { refreshLock: 1, refreshLockAt: 1 } });
    } catch {
      throw httpError(500, 'SOURCE_REFRESH_RECOVERY_FAILED', 'The source refresh could not be completed safely. Please contact support before using this source.');
    }
    throw error;
  }
}
