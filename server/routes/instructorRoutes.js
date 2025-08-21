import express from 'express';
import { listInstructors, createInstructor } from '../controllers/instructorController.js';
import { getInstructorEvaluationsSummary } from '../controllers/evaluationsController.js';
import authMiddleware, { authorizeRole } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Multer config for instructor images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads', 'instructors');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Public: list instructors
router.get('/', listInstructors);

// Public: instructor evaluations summary (avg rating, counts)
router.get('/:id/evaluations-summary', getInstructorEvaluationsSummary);

// Admin: create instructor card (supports file upload as 'image')
router.post('/', authMiddleware, authorizeRole(['admin']), upload.single('image'), createInstructor);

export default router;
