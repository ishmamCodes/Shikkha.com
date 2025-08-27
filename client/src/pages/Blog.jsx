import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiHeart, FiMessageSquare, FiUpload, FiImage, FiUser } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Helpers to compute a friendly display name
const looksLikeEmail = (s) => typeof s === 'string' && s.includes('@');
const toTitleFromEmail = (email) => {
  if (!email || !looksLikeEmail(email)) return '';
  const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return base
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};
const getDisplayName = (userObj) => {
  // Handle new data structure: userObj.userData contains the actual user data
  const u = userObj?.userData || userObj;
  if (!u) return 'Anonymous';
  if (u.fullName && u.fullName.trim()) return u.fullName;
  if (u.name && u.name.trim()) return u.name;
  if (u.username && u.username.trim()) return u.username;
  if (u.email && u.email.trim()) {
    const derived = toTitleFromEmail(u.email);
    if (derived) return derived;
  }
  return 'Anonymous';
};

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [newBlog, setNewBlog] = useState({ title: '', content: '' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Configure axios defaults
  axios.defaults.baseURL = 'http://localhost:4000';
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  axios.defaults.withCredentials = true;

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await axios.get('/api/blogs');
      setBlogs(res.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      alert("Failed to fetch blogs. Please try again.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    if (!user) {
      alert("Please log in first to post.");
      return;
    }

    if (!newBlog.title || !newBlog.content) {
      alert("Title and content are required.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', newBlog.title);
    formData.append('content', newBlog.content);
    if (image) formData.append('image', image);

    try {
      await axios.post('/api/blogs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setNewBlog({ title: '', content: '' });
      setImage(null);
      setImagePreview(null);
      fetchBlogs();
    } catch (error) {
      console.error("Error posting blog:", error);
      alert("Failed to post blog. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id) => {
    try {
      await axios.post(`/api/blogs/${id}/like`, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      fetchBlogs();
    } catch (error) {
      console.error("Error liking blog:", error);
      alert(error.response?.data?.error || "Failed to like blog");
    }
  };

  const handleComment = async (id) => {
    if (!user) return alert("Please log in to comment.");
    if (!commentText[id]?.trim()) return alert("Comment cannot be empty");
  
    try {
      await axios.post(`/api/blogs/${id}/comment`, 
        { text: commentText[id] },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      setCommentText({ ...commentText, [id]: '' });
      fetchBlogs();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert(error.response?.data?.error || "Failed to post comment");
    }
  };

  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
  <div className="max-w-2xl mx-auto">
    {/* Header */}
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mr-3 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">Blogging Universe</h1>
      </div>
    </div>

    {/* Create Post Card */}
    <AnimatePresence>
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.5,
            type: "spring",
            stiffness: 300
          }}
          className="bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl p-6 mb-8 border border-white/10"
        >
          <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
            Create a Post
          </h2>
          
          <div className="mb-4">
            <motion.input
              whileFocus={{ 
                scale: 1.02, 
                boxShadow: "0 0 0 2px rgba(192, 132, 252, 0.5)"
              }}
              type="text"
              placeholder="Post Title"
              value={newBlog.title}
              onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
              className="w-full p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              required
            />
          </div>
          
          <div className="mb-4">
            <motion.textarea
              whileFocus={{ 
                scale: 1.01, 
                boxShadow: "0 0 0 2px rgba(129, 140, 248, 0.5)"
              }}
              placeholder="What's on your mind?"
              value={newBlog.content}
              onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
              className="w-full p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl h-32 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
              required
            />
          </div>
          
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 relative overflow-hidden rounded-xl border border-emerald-500/30 shadow-lg"
            >
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-xl"
              />
              <motion.button 
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 bg-gradient-to-br from-red-500 to-pink-600 text-white p-2 rounded-full shadow-xl"
              >
                &times;
              </motion.button>
            </motion.div>
          )}
          
          <div className="flex items-center justify-between">
            <motion.label 
              whileHover={{ 
                scale: 1.05,
                background: "linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.2))"
              }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center px-4 py-2 bg-slate-800/40 rounded-xl cursor-pointer border border-slate-700/50 text-slate-200"
            >
              <FiImage className="mr-2 text-purple-400 text-lg" />
              <span className="font-medium">Add Image</span>
              <input 
                type="file" 
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
            </motion.label>
            
            <motion.button
              whileHover={{ 
                scale: 1.07,
                boxShadow: "0 5px 20px rgba(139, 92, 246, 0.4)",
              }}
              whileTap={{ scale: 0.93 }}
              onClick={handlePost}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg ${
                isSubmitting 
                  ? 'bg-gradient-to-r from-indigo-700 to-violet-700 opacity-70' 
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600'
              } transition-all`}
            >
              {isSubmitting ? (
                <motion.span
                  animate={{
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  Posting...
                </motion.span>
              ) : 'Post'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Blog Posts */}
    <div className="space-y-6">
      {blogs.length > 0 ? (
        <AnimatePresence>
          {blogs.map((blog) => (
            <motion.div
              key={blog._id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ 
                duration: 0.3,
                type: "spring",
                stiffness: 250
              }}
              className="bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            >
              {/* Post Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
                <div className="flex items-center">
                  <motion.div 
                    whileHover={{ 
                      scale: 1.15,
                      rotate: [0, 10, -10, 0],
                      boxShadow: "0 5px 15px rgba(99, 102, 241, 0.3)"
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 w-10 h-10 rounded-full flex items-center justify-center mr-3 shadow-lg"
                  >
                    {(() => {
                      const name = getDisplayName(blog.author);
                      return name !== 'Anonymous' && name.length > 0 ? (
                        <span className="font-bold text-white">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <FiUser className="text-white text-lg" />
                      );
                    })()}
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
                      {getDisplayName(blog.author)}
                    </h3>
                    <p className="text-xs text-purple-300/70">
                      {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Post Content */}
              <div className="p-4 bg-slate-900/20">
                <h3 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
                  {blog.title}
                </h3>
                <p className="text-slate-200 mb-4 whitespace-pre-line">{blog.content}</p>
                
                {blog.image && (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    src={`http://localhost:4000/${blog.image}`}
                    alt="Blog"
                    className="w-full max-h-96 object-contain rounded-lg mb-4 shadow-md border border-indigo-500/30"
                  />
                )}
              </div>
              
              {/* Post Actions */}
              <div className="px-4 py-2 border-t border-white/10 flex justify-between bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleLike(blog._id)}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    blog.likes?.some(like => like.userId === user?._id) 
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 font-bold' 
                      : 'text-purple-300 hover:text-pink-400'
                  } transition-colors`}
                >
                  <motion.span
                    animate={{
                      scale: blog.likes?.some(like => like.userId === user?._id) ? [1, 1.3, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <FiHeart className="mr-2 text-lg" />
                  </motion.span>
                  <span>{blog.likes?.length || 0} Likes</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center px-4 py-2 rounded-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300"
                >
                  <FiMessageSquare className="mr-2 text-lg" />
                  <span>{blog.comments?.length || 0} Comments</span>
                </motion.button>
              </div>
              
              {/* Comments Section */}
              <motion.div 
                layout
                className="px-4 py-2 bg-slate-900/30"
              >
                <div className="flex mb-4">
                  <motion.input
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 2px rgba(167, 139, 250, 0.5)"
                    }}
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText[blog._id] || ''}
                    onChange={(e) =>
                      setCommentText({ ...commentText, [blog._id]: e.target.value })
                    }
                    className="flex-1 p-2 bg-slate-800/40 border border-slate-700/50 rounded-l-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                  />
                  <motion.button
                    whileHover={{ 
                      scale: 1.07,
                      boxShadow: "0 5px 20px rgba(139, 92, 246, 0.4)",
                    }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleComment(blog._id)}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-r-xl shadow-lg transition-all"
                  >
                    Post
                  </motion.button>
                </div>
                
                {blog.comments?.length > 0 && (
                  <motion.div 
                    layout
                    className="space-y-3"
                  >
                    {blog.comments.map((c, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start"
                      >
                        <motion.div 
                          whileHover={{ 
                            scale: 1.1,
                            rotate: [0, 10, -10, 0],
                            boxShadow: "0 5px 15px rgba(16, 185, 129, 0.3)"
                          }}
                          className="bg-gradient-to-r from-emerald-400 to-teal-500 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 shadow-lg"
                        >
                          {(() => {
                            const name = getDisplayName(c.user);
                            return name !== 'Anonymous' && name.length > 0 ? (
                              <span className="text-xs font-bold text-white">
                                {name.charAt(0).toUpperCase()}
                              </span>
                            ) : (
                              <FiUser className="text-white text-sm" />
                            );
                          })()}
                        </motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="bg-slate-800/40 p-3 rounded-lg flex-1 border border-slate-700/50"
                        >
                          <div className="flex items-center mb-1">
                            <span className="font-semibold text-sm mr-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                              {getDisplayName(c.user)}
                            </span>
                            <span className="text-xs text-purple-300/70">
                              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-slate-200 text-sm">{c.text}</p>
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center border border-white/10"
        >
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            className="text-5xl mb-4 w-24 h-24 rounded-full flex items-center justify-center mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xl"
          >
            ✍️
          </motion.div>
          <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 mb-2">
            No posts yet
          </h3>
          <p className="text-purple-300/70">
            {user ? "Be the first to share your thoughts!" : "Sign in to create the first post!"}
          </p>
        </motion.div>
      )}
    </div>
  </div>
</div>
}

export default Blog;