import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String }, // filepath for uploaded image
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
