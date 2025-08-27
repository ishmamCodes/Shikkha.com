import Material from '../models/Material.js';
import Course from '../models/Course.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'materials');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|mp4|avi|mov|mp3|wav/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, documents, presentations, videos, and audio files are allowed!'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: fileFilter
});

// Upload material
export const uploadMaterial = async (req, res) => {
  try {
    const { title, description, courseId, contentType, isPublic, tags } = req.body;
    const educatorId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Verify educator owns the course (if courseId provided)
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course || course.instructor.toString() !== educatorId) {
        return res.status(403).json({ success: false, message: 'Not authorized to upload materials for this course' });
      }
    }

    // Determine content type based on file extension if not provided
    let materialContentType = contentType;
    if (!materialContentType) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        materialContentType = 'image';
      } else if (['.pdf'].includes(ext)) {
        materialContentType = 'pdf';
      } else if (['.doc', '.docx'].includes(ext)) {
        materialContentType = 'doc';
      } else if (['.ppt', '.pptx'].includes(ext)) {
        materialContentType = 'presentation';
      } else if (['.mp4', '.avi', '.mov'].includes(ext)) {
        materialContentType = 'video';
      } else if (['.mp3', '.wav'].includes(ext)) {
        materialContentType = 'audio';
      } else {
        materialContentType = 'text';
      }
    }

    const material = new Material({
      title: title || req.file.originalname,
      description: description || '',
      contentType: materialContentType,
      url: `/uploads/materials/${req.file.filename}`,
      fileType: path.extname(req.file.originalname),
      fileSize: req.file.size,
      uploadedBy: educatorId,
      courseId: courseId || null,
      isPublic: isPublic !== undefined ? isPublic : true,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await material.save();

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      material: material
    });

  } catch (error) {
    console.error('Upload material error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload material' });
  }
};

// Get materials by educator
export const getEducatorMaterials = async (req, res) => {
  try {
    const educatorId = req.user.id;
    const { courseId } = req.query;

    let query = { uploadedBy: educatorId };
    if (courseId) {
      query.courseId = courseId;
    }

    const materials = await Material.find(query)
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, materials });
  } catch (error) {
    console.error('Get educator materials error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch materials' });
  }
};

// Get materials for students (by course)
export const getCourseMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;

    const materials = await Material.find({
      courseId: courseId,
      isPublic: true
    })
    .populate('uploadedBy', 'fullName')
    .sort({ order: 1, createdAt: -1 });

    res.json({ success: true, materials });
  } catch (error) {
    console.error('Get course materials error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course materials' });
  }
};

// Download material
export const downloadMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const material = await Material.findById(materialId);

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    const filePath = path.join(process.cwd(), material.url.replace(/^\//, ''));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${material.title}${material.fileType}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({ success: false, message: 'Failed to download material' });
  }
};

// Delete material
export const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const educatorId = req.user.id;

    const material = await Material.findById(materialId);
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    if (material.uploadedBy.toString() !== educatorId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this material' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), material.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Material.findByIdAndDelete(materialId);

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete material' });
  }
};

// Update material
export const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title, description, isPublic, tags } = req.body;
    const educatorId = req.user.id;

    const material = await Material.findById(materialId);
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    if (material.uploadedBy.toString() !== educatorId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this material' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (tags) updateData.tags = tags.split(',').map(tag => tag.trim());

    const updatedMaterial = await Material.findByIdAndUpdate(
      materialId,
      updateData,
      { new: true }
    ).populate('courseId', 'title');

    res.json({ success: true, material: updatedMaterial });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ success: false, message: 'Failed to update material' });
  }
};
