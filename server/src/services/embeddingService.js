import { env } from '../config/env.js';
import { httpError } from '../middleware/errors.js';

const BATCH_SIZE = 64;
const REQUEST_TIMEOUT_MS = 60_000;

export async function embedTexts(texts) {
  if (!env.OLLAMA_BASE_URL || !env.OLLAMA_EMBEDDING_MODEL) {
    throw httpError(503, 'EMBEDDING_SETUP_REQUIRED', 'Semantic search needs OLLAMA_BASE_URL and OLLAMA_EMBEDDING_MODEL in server/.env.');
  }
  const embeddings = [];
  for (let offset = 0; offset < texts.length; offset += BATCH_SIZE) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(new URL('/api/embed', env.OLLAMA_BASE_URL), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ model: env.OLLAMA_EMBEDDING_MODEL, input: texts.slice(offset, offset + BATCH_SIZE), truncate: false }),
      });
      if (!response.ok) throw httpError(502, 'EMBEDDING_PROVIDER_ERROR', 'Ollama could not create semantic indexes. Check that the embedding model is installed.');
      const result = await response.json();
      const batch = result.embeddings;
      if (!Array.isArray(batch) || batch.length !== texts.slice(offset, offset + BATCH_SIZE).length || batch.some(vector => !Array.isArray(vector) || !vector.length || vector.some(value => !Number.isFinite(value)))) {
        throw httpError(502, 'EMBEDDING_FORMAT_ERROR', 'Ollama returned an invalid embedding response.');
      }
      embeddings.push(...batch);
    } catch (error) {
      if (error.status) throw error;
      throw httpError(502, 'EMBEDDING_PROVIDER_UNAVAILABLE', error.name === 'AbortError' ? 'Semantic indexing took too long. Try again later.' : 'Could not reach Ollama for semantic indexing.');
    } finally { clearTimeout(timer); }
  }
  const dimensions = embeddings[0]?.length;
  if (!dimensions || embeddings.some(vector => vector.length !== dimensions)) throw httpError(502, 'EMBEDDING_FORMAT_ERROR', 'Ollama returned vectors with inconsistent dimensions.');
  return embeddings;
}

export async function tryEmbedTexts(texts) {
  if (!env.OLLAMA_BASE_URL || !env.OLLAMA_EMBEDDING_MODEL) return null;
  try { return await embedTexts(texts); }
  catch (error) { console.warn('Semantic indexing skipped; keyword retrieval remains available:', error.code || error.message); return null; }
}
