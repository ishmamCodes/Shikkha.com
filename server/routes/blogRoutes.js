import express from 'express';
import multer from 'multer';
import Blog from '../models/Blog.js';
import Student from '../models/Student.js';
import Educator from '../models/Educator.js';
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

// Helper function to get user data by role
const getUserByRole = async (userId, role) => {
  const Model = role === 'student' ? Student : Educator;
  return await Model.findById(userId).select('fullName email avatarUrl role');
};

// Helper function to populate blog with user data
const populateBlogUsers = async (blog) => {
  // Populate author
  if (blog.author && blog.author.userId && blog.author.role) {
    const authorData = await getUserByRole(blog.author.userId, blog.author.role);
    blog.author.userData = authorData;
  }
  
  // Populate comment users
  if (blog.comments && blog.comments.length > 0) {
    for (let comment of blog.comments) {
      if (comment.user && comment.user.userId && comment.user.role) {
        const userData = await getUserByRole(comment.user.userId, comment.user.role);
        comment.user.userData = userData;
      }
    }
  }
  
  return blog;
};

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
      author: {
        userId: req.user.id,
        role: req.user.role
      }
    });

    await newBlog.save();
    
    // Populate author data
    const populatedBlog = await populateBlogUsers(newBlog.toObject());
      
    res.status(201).json(populatedBlog);
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({ error: "Failed to create blog" });
  }
});

// Get all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
    
    // Populate user data for each blog
    const populatedBlogs = await Promise.all(
      blogs.map(blog => populateBlogUsers(blog))
    );
    
    res.json(populatedBlogs);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// Like a blog
router.post('/:blogId/like', authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Check if user already liked
    const existingLikeIndex = blog.likes.findIndex(
      like => like.userId.toString() === userId.toString()
    );
    
    if (existingLikeIndex > -1) {
      // Remove like
      blog.likes.splice(existingLikeIndex, 1);
    } else {
      // Add like
      blog.likes.push({ userId, role: userRole });
    }

    await blog.save();
    
    // Return populated blog
    const populatedBlog = await populateBlogUsers(blog.toObject());
    res.json(populatedBlog);
  } catch (err) {
    console.error("Error liking blog:", err);
    res.status(500).json({ error: "Failed to like blog", details: err.message });
  }
});

// Comment on a blog
router.post('/:blogId/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text required" });

    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    blog.comments.push({
      user: {
        userId: req.user.id,
        role: req.user.role
      },
      text: text
    });

    await blog.save();
    
    // Return populated blog
    const populatedBlog = await populateBlogUsers(blog.toObject());
    res.json(populatedBlog);
  } catch (err) {
    console.error("Error commenting on blog:", err);
    res.status(500).json({ error: "Failed to comment on blog", details: err.message });
  }
});

export default router;