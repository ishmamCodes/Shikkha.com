import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiHeart, FiMessageSquare, FiUpload, FiImage, FiUser } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 bg-gradient-to-b from-indigo-50 to-purple-100 min-h-screen">
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
            className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl p-6 mb-8 border-2 border-indigo-200"
          >
            <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-indigo-600">
              Create a Post
            </h2>
            
            <div className="mb-4">
              <motion.input
                whileFocus={{ 
                  scale: 1.02, 
                  borderColor: "#c026d3",
                  boxShadow: "0 0 0 3px rgba(192, 38, 211, 0.2)"
                }}
                type="text"
                placeholder="Post Title"
                value={newBlog.title}
                onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                className="w-full p-3 border-2 border-fuchsia-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent shadow-sm bg-white/95"
                required
              />
            </div>
            
            <div className="mb-4">
              <motion.textarea
                whileFocus={{ 
                  scale: 1.01, 
                  borderColor: "#7c3aed",
                  boxShadow: "0 0 0 3px rgba(124, 58, 237, 0.2)"
                }}
                placeholder="What's on your mind?"
                value={newBlog.content}
                onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                className="w-full p-3 border-2 border-indigo-200 rounded-xl h-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm bg-white/95"
                required
              />
            </div>
            
            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 relative overflow-hidden rounded-xl border-2 border-emerald-200 shadow-lg"
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
                  background: "linear-gradient(to right, #e9d5ff, #c7d2fe)"
                }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-violet-100 to-indigo-100 rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-all border-2 border-violet-200"
              >
                <FiImage className="mr-2 text-violet-600 text-lg" />
                <span className="text-violet-700 font-medium">Add Image</span>
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
                  background: "linear-gradient(to right, #8b5cf6, #6366f1)"
                }}
                whileTap={{ scale: 0.93 }}
                onClick={handlePost}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-xl text-white font-bold shadow-xl ${
                  isSubmitting 
                    ? 'bg-gradient-to-r from-indigo-400 to-violet-400' 
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
                className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl overflow-hidden border-2 border-indigo-200"
              >
                {/* Post Header */}
                <div className="p-4 border-b-2 border-indigo-200 bg-gradient-to-r from-violet-100 to-indigo-100">
                  <div className="flex items-center">
                    <motion.div 
                      whileHover={{ 
                        scale: 1.15,
                        rotate: [0, 10, -10, 0],
                        boxShadow: "0 5px 15px rgba(99, 102, 241, 0.3)"
                      }}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 w-10 h-10 rounded-full flex items-center justify-center mr-3 shadow-lg"
                    >
                      {blog.author?.username ? (
                        <span className="font-bold text-white">
                          {blog.author.username.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <FiUser className="text-white text-lg" />
                      )}
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-indigo-700">
                        {blog.author?.username || "Anonymous"}
                      </h3>
                      <p className="text-xs text-violet-500">
                        {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Post Content */}
                <div className="p-4 bg-white/80">
                  <h3 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700">
                    {blog.title}
                  </h3>
                  <p className="text-gray-800 mb-4 whitespace-pre-line">{blog.content}</p>
                  
                  {blog.image && (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      src={`http://localhost:4000/${blog.image}`}
                      alt="Blog"
                      className="w-full max-h-96 object-contain rounded-lg mb-4 shadow-md border-2 border-indigo-100"
                    />
                  )}
                </div>
                
                {/* Post Actions */}
                <div className="px-4 py-2 border-t-2 border-indigo-200 flex justify-between bg-gradient-to-r from-violet-100 to-indigo-100">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleLike(blog._id)}
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      blog.likes?.includes(user?._id) 
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600 font-bold' 
                        : 'text-violet-700 hover:text-pink-600'
                    } transition-colors`}
                  >
                    <motion.span
                      animate={{
                        scale: blog.likes?.includes(user?._id) ? [1, 1.3, 1] : 1,
                        color: blog.likes?.includes(user?._id) ? "#db2777" : "#6d28d9"
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
                    className="flex items-center px-4 py-2 rounded-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 transition-colors"
                  >
                    <FiMessageSquare className="mr-2 text-lg" />
                    <span>{blog.comments?.length || 0} Comments</span>
                  </motion.button>
                </div>
                
                {/* Comments Section */}
                <motion.div 
                  layout
                  className="px-4 py-2 bg-gradient-to-b from-indigo-50 to-violet-50"
                >
                  <div className="flex mb-4">
                    <motion.input
                      whileFocus={{ 
                        scale: 1.02,
                        borderColor: "#8b5cf6",
                        boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.2)"
                      }}
                      type="text"
                      placeholder="Write a comment..."
                      value={commentText[blog._id] || ''}
                      onChange={(e) =>
                        setCommentText({ ...commentText, [blog._id]: e.target.value })
                      }
                      className="flex-1 p-2 border-2 border-violet-200 rounded-l-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-sm bg-white"
                    />
                    <motion.button
                      whileHover={{ 
                        scale: 1.07,
                        boxShadow: "0 5px 20px rgba(124, 58, 237, 0.4)",
                        background: "linear-gradient(to right, #7c3aed, #6d28d9)"
                      }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => handleComment(blog._id)}
                      className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-r-xl shadow-lg transition-all"
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
                            {c.user?.username ? (
                              <span className="text-xs font-bold text-white">
                                {c.user.username.charAt(0).toUpperCase()}
                              </span>
                            ) : (
                              <FiUser className="text-white text-sm" />
                            )}
                          </motion.div>
                          <motion.div 
                            whileHover={{ scale: 1.01 }}
                            className="bg-white p-3 rounded-lg shadow-sm flex-1 border-2 border-indigo-100"
                          >
                            <div className="flex items-center mb-1">
                              <span className="font-semibold text-sm mr-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                                {c.user?.username || 'Anonymous'}
                              </span>
                              <span className="text-xs text-violet-500">
                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-gray-800 text-sm">{c.text}</p>
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
            className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl p-8 text-center border-2 border-indigo-200"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 10, -10, 0],
                background: [
                  "linear-gradient(45deg, #a855f7, #6366f1)", 
                  "linear-gradient(45deg, #6366f1, #a855f7)",
                  "linear-gradient(45deg, #a855f7, #6366f1)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
              className="text-5xl mb-4 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-xl"
            >
              ✍️
            </motion.div>
            <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-indigo-700 mb-2">
              No posts yet
            </h3>
            <p className="text-violet-600">
              {user ? "Be the first to share your thoughts!" : "Sign in to create the first post!"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Blog;