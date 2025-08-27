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

// PUT /api/instructors/:id (admin)
export const updateInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, expertise, achievements, contact } = req.body || {};
    let { image } = req.body || {};

    const existing = await Instructor.findById(id);
    if (!existing) return res.status(404).json({ message: 'Instructor not found' });

    if (req.file) {
      image = `/uploads/instructors/${req.file.filename}`;
    }

    if (typeof name === 'string') existing.name = name;
    if (typeof expertise === 'string') existing.expertise = expertise;
    if (typeof achievements === 'string') existing.achievements = achievements;
    if (typeof contact === 'string') existing.contact = contact;
    if (typeof image === 'string' && image.length > 0) existing.image = image;

    await existing.save();
    return res.status(200).json(existing);
  } catch (e) {
    console.error('[updateInstructor]', e);
    return res.status(500).json({ message: 'Failed to update instructor' });
  }
};

// DELETE /api/instructors/:id (admin)
export const deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Instructor.findById(id);
    if (!existing) return res.status(404).json({ message: 'Instructor not found' });

    await Instructor.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Instructor deleted' });
  } catch (e) {
    console.error('[deleteInstructor]', e);
    return res.status(500).json({ message: 'Failed to delete instructor' });
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
