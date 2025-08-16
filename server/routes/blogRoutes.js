import express from 'express';
import multer from 'multer';
import Blog from '../models/Blog.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create new blog
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  try {
    const imagePath = req.file ? req.file.path : null;

    const newBlog = new Blog({
      title,
      content,
      image: imagePath,
      author: req.user.id
    });

    await newBlog.save();
    
    // Populate author before returning
    const populatedBlog = await Blog.findById(newBlog._id)
      .populate('author', 'username');
      
    res.status(201).json(populatedBlog);
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({ error: "Failed to create blog" });
  }
});

// Get all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username')
      .populate('comments.user', 'username');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// Like a blog
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const userId = req.user.id;
    if (blog.likes.includes(userId)) {
      blog.likes = blog.likes.filter(id => id.toString() !== userId.toString());
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    
    // Populate after update
    const updatedBlog = await Blog.findById(blog._id)
      .populate('author', 'username')
      .populate('comments.user', 'username');
      
    res.json(updatedBlog);
  } catch (err) {
    res.status(500).json({ error: "Failed to like blog", details: err.message });
  }
});

// Comment on a blog
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text required" });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    blog.comments.push({
      user: req.user.id,
      text: text
    });

    await blog.save();
    
    // Populate after update
    const updatedBlog = await Blog.findById(blog._id)
      .populate('author', 'username')
      .populate('comments.user', 'username');
      
    res.json(updatedBlog);
  } catch (err) {
    res.status(500).json({ error: "Failed to comment on blog", details: err.message });
  }
});

export default router;