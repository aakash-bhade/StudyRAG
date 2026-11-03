import { PDFParse } from 'pdf-parse';
import mammoth from '@adobe/mammoth';
import yauzl from 'yauzl';
import { httpError } from '../middleware/errors.js';

const MAX_TEXT_CHARACTERS = 1_500_000;
const MAX_DOCX_ENTRIES = 500;
const MAX_DOCX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
const MIME_BY_EXTENSION = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

function cleanText(text) {
  return text.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function splitText(text, page = null, startOrdinal = 0) {
  const chunks = [];
  let position = 0;
  while (position < text.length) {
    let end = Math.min(position + 1200, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf(' ', end);
      if (boundary > position + 700) end = boundary;
    }
    const part = text.slice(position, end).trim();
    if (part) chunks.push({ ordinal: startOrdinal + chunks.length, text: part, page });
    if (end >= text.length) break;
    position = Math.max(end - 120, position + 1);
  }
  return chunks;
}

function assertDocxArchive(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true, decodeStrings: true }, (error, archive) => {
      if (error) return reject(httpError(422, 'INVALID_DOCX', 'This DOCX file could not be opened.'));
      let entries = 0;
      let totalSize = 0;
      const required = new Set(['[Content_Types].xml', 'word/document.xml']);
      archive.on('error', () => reject(httpError(422, 'INVALID_DOCX', 'This DOCX file could not be opened.')));
      archive.on('entry', entry => {
        entries += 1;
        totalSize += entry.uncompressedSize;
        const unsafeName = entry.fileName.split(/[\\/]/).includes('..');
        const encrypted = (entry.generalPurposeBitFlag & 1) !== 0;
        const ratio = entry.compressedSize === 0 ? entry.uncompressedSize : entry.uncompressedSize / entry.compressedSize;
        if (entries > MAX_DOCX_ENTRIES || totalSize > MAX_DOCX_UNCOMPRESSED_BYTES || entry.uncompressedSize > MAX_DOCX_UNCOMPRESSED_BYTES || ratio > 150 || unsafeName || encrypted) {
          archive.close();
          return reject(httpError(422, 'DOCX_LIMIT_EXCEEDED', 'This DOCX contains unsupported or unusually large archive content.'));
        }
        required.delete(entry.fileName);
        archive.readEntry();
      });
      archive.on('end', () => {
        if (required.size) return reject(httpError(422, 'INVALID_DOCX', 'This file is not a valid DOCX document.'));
        resolve();
      });
      archive.readEntry();
    });
  });
}

async function parsePdf(buffer) {
  if (!buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))) throw httpError(415, 'FILE_CONTENT_MISMATCH', 'The file contents do not match a PDF.');
  const parser = new PDFParse({ data: buffer, verbosity: 0 });
  try {
    const info = await parser.getInfo();
    if (!info.total || info.total > 200) throw httpError(413, 'PDF_PAGE_LIMIT', 'PDFs must contain between 1 and 200 pages.');
    const result = await parser.getText();
    const pageResults = result.pages || [];
    const pages = pageResults.map((item, index) => ({ page: item.num || index + 1, text: cleanText(item.text || '') })).filter(item => item.text);
    const combined = cleanText(pages.map(item => item.text).join('\n\n'));
    if (!combined) throw httpError(422, 'EMPTY_DOCUMENT', 'No readable text was found. Scanned PDFs need OCR, which is not enabled yet.');
    if (combined.length > MAX_TEXT_CHARACTERS) throw httpError(413, 'EXTRACTED_TEXT_LIMIT', 'The extracted text is too large to process.');
    const chunks = [];
    for (const { page, text } of pages) {
      const pageChunks = splitText(text, page, chunks.length);
      chunks.push(...pageChunks);
    }
    return { text: combined, pages: info.total, chunks };
  } catch (error) {
    if (error.status) throw error;
    throw httpError(422, 'PDF_PARSE_FAILED', 'This PDF could not be read. Check that it is not damaged or password-protected.');
  } finally {
    await parser.destroy().catch(() => {});
  }
}

async function parseDocx(buffer) {
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw httpError(415, 'FILE_CONTENT_MISMATCH', 'The file contents do not match a DOCX.');
  await assertDocxArchive(buffer);
  const result = await mammoth.extractRawText({ buffer });
  const text = cleanText(result.value || '');
  if (!text) throw httpError(422, 'EMPTY_DOCUMENT', 'No readable text was found in this DOCX.');
  if (text.length > MAX_TEXT_CHARACTERS) throw httpError(413, 'EXTRACTED_TEXT_LIMIT', 'The extracted text is too large to process.');
  return { text, pages: null, chunks: splitText(text) };
}

async function parsePlainText(buffer) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
  catch { throw httpError(415, 'INVALID_TEXT_ENCODING', 'Text files must use UTF-8 encoding.'); }
  if (text.includes('\u0000')) throw httpError(415, 'FILE_CONTENT_MISMATCH', 'The file contents do not look like plain text.');
  text = cleanText(text);
  if (!text) throw httpError(422, 'EMPTY_DOCUMENT', 'This text file is empty.');
  if (text.length > MAX_TEXT_CHARACTERS) throw httpError(413, 'EXTRACTED_TEXT_LIMIT', 'The text is too large to process.');
  return { text, pages: null, chunks: splitText(text) };
}

export async function parseDocument(buffer, extension) {
  if (!MIME_BY_EXTENSION[extension]) throw httpError(415, 'UNSUPPORTED_FILE_TYPE', 'Upload a PDF, DOCX, or UTF-8 TXT file.');
  if (extension === '.pdf') return parsePdf(buffer);
  if (extension === '.docx') return parseDocx(buffer);
  return parsePlainText(buffer);
}

export function documentMimeType(extension) { return MIME_BY_EXTENSION[extension]; }
export function splitDocumentName(name) { return name.replace(/[\\/\u0000-\u001f]/g, '_').trim().slice(0, 255) || 'Untitled document'; }
