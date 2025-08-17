import Instructor from '../models/Instructor.js';
import Educator from '../models/Educator.js';

// GET /api/instructors (public)
export const listInstructors = async (req, res) => {
  try {
    console.log('[listInstructors] Fetching instructors...');
    const instructors = await Instructor.find()
      .populate('educatorId', 'fullName email')
      .select('name expertise achievements contact image educatorId createdAt')
      .lean()
      .sort({ createdAt: -1 });
    console.log('[listInstructors] Found instructors:', instructors.length);
    
    // Set cache headers for better performance
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes cache
      'ETag': `"${instructors.length}-${Date.now()}"`
    });
    
    res.status(200).json(instructors);
  } catch (e) {
    console.error('[listInstructors] Error:', e);
    res.status(500).json({ message: 'Failed to fetch instructors', error: e.message });
  }
};

// POST /api/instructors (admin)
export const createInstructor = async (req, res) => {
  try {
    const { educatorId, name, expertise, achievements, contact } = req.body || {};
    let { image } = req.body || {};
    if (!educatorId || !name) {
      return res.status(400).json({ message: 'educatorId and name are required' });
    }

    const educator = await Educator.findById(educatorId).lean();
    if (!educator) return res.status(404).json({ message: 'Educator not found' });

    const existing = await Instructor.findOne({ educatorId }).lean();
    if (existing) return res.status(409).json({ message: 'Instructor card already exists for this educator' });

    // If a file was uploaded via multer, prefer it over image URL
    if (req.file) {
      image = `/uploads/instructors/${req.file.filename}`;
    }

    const inst = await Instructor.create({ educatorId, name, expertise, image, achievements, contact });
    res.status(201).json(inst);
  } catch (e) {
    console.error('[createInstructor]', e);
    res.status(500).json({ message: 'Failed to create instructor' });
  }
};
