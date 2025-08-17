import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String }, // filepath for uploaded image
  author: { 
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['student', 'educator'], required: true }
  },
  likes: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['student', 'educator'], required: true }
  }],
  comments: [
    {
      user: { 
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        role: { type: String, enum: ['student', 'educator'], required: true }
      },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
