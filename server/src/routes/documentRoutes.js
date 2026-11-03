import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { deleteDocumentAction, downloadDocumentAction, listDocumentsAction, renameDocumentAction, uploadDocumentAction } from '../controllers/documentController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { httpError } from '../middleware/errors.js';
import { validate } from '../validators/auth.js';
import { documentListSchema, renameDocumentSchema, validateQuery } from '../validators/documents.js';

const router = Router();
const allowedExtensions = new Set(['.pdf', '.docx', '.txt']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 1, fieldNameSize: 60 },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.has(extension)) return callback(httpError(415, 'UNSUPPORTED_FILE_TYPE', 'Upload a PDF, DOCX, or TXT file.'));
    callback(null, true);
  },
});
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });

function singleFile(req, res, next) {
  upload.single('file')(req, res, error => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return next(httpError(413, 'FILE_TOO_LARGE', 'Files must be 10 MB or smaller.'));
    if (error instanceof multer.MulterError) return next(httpError(400, 'INVALID_UPLOAD', 'Upload one file in the file field.'));
    next(error);
  });
}

router.use(requireAuth);
router.get('/', validateQuery(documentListSchema), listDocumentsAction);
router.post('/', uploadLimiter, singleFile, uploadDocumentAction);
router.get('/:id/download', downloadDocumentAction);
router.patch('/:id', validate(renameDocumentSchema), renameDocumentAction);
router.delete('/:id', deleteDocumentAction);

export default router;
