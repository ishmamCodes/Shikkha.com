import express from 'express';
import { 
  uploadMaterial, 
  getEducatorMaterials, 
  getCourseMaterials, 
  downloadMaterial, 
  deleteMaterial, 
  updateMaterial,
  upload 
} from '../controllers/materialController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload material (educators only)
router.post('/upload', authMiddleware, upload.single('file'), uploadMaterial);

// Get materials by educator
router.get('/educator', authMiddleware, getEducatorMaterials);

// Get materials for a course (students)
router.get('/course/:courseId', authMiddleware, getCourseMaterials);

// Download material
router.get('/download/:materialId', authMiddleware, downloadMaterial);

// Update material
router.put('/:materialId', authMiddleware, updateMaterial);

// Delete material
router.delete('/:materialId', authMiddleware, deleteMaterial);

export default router;
