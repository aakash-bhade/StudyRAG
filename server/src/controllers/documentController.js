import { createReadStream } from 'node:fs';
import { getOwnedDocumentFile, indexOwnedDocumentEmbeddings, listOwnedDocuments, renameOwnedDocument, deleteOwnedDocument, uploadOwnedDocument } from '../services/documentService.js';

export async function listDocumentsAction(req, res, next) {
  try { res.json(await listOwnedDocuments(req.user._id, req.validatedQuery)); } catch (error) { next(error); }
}

export async function uploadDocumentAction(req, res, next) {
  try { res.status(201).json({ item: await uploadOwnedDocument(req.user._id, req.file) }); } catch (error) { next(error); }
}

export async function indexDocumentEmbeddingsAction(req, res, next) {
  try { res.json({ item: await indexOwnedDocumentEmbeddings(req.user._id, req.params.id) }); } catch (error) { next(error); }
}

export async function renameDocumentAction(req, res, next) {
  try { res.json({ item: await renameOwnedDocument(req.user._id, req.params.id, req.body.displayName) }); } catch (error) { next(error); }
}

export async function deleteDocumentAction(req, res, next) {
  try { res.json(await deleteOwnedDocument(req.user._id, req.params.id)); } catch (error) { next(error); }
}

export async function downloadDocumentAction(req, res, next) {
  try {
    const { document, filePath } = await getOwnedDocumentFile(req.user._id, req.params.id);
    const safeFilename = document.displayName.replace(/[^A-Za-z0-9._ -]/g, '_').replace(/\s+/g, ' ').slice(0, 150) || 'document';
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', document.byteSize);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const stream = createReadStream(filePath);
    stream.on('error', next);
    stream.pipe(res);
  } catch (error) { next(error); }
}
