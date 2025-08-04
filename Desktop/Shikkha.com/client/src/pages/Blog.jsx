import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiHeart, FiMessageSquare, FiUpload, FiImage, FiUser } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Create Post Card */}
      {user && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Create a Post</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Post Title"
              value={newBlog.title}
              onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="mb-4">
            <textarea
              placeholder="What's on your mind?"
              value={newBlog.content}
              onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          {imagePreview && (
            <div className="mb-4 relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <button 
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              >
                &times;
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <label className="flex items-center px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
              <FiImage className="mr-2" />
              <span>Add Image</span>
              <input 
                type="file" 
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
            </label>
            
            <button
              onClick={handlePost}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg text-white font-medium ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Blog Posts */}
      <div className="space-y-6">
        {blogs.length > 0 ? (
          blogs.map((blog) => (
            <div key={blog._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Post Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    {blog.author?.username ? (
                      <span className="font-semibold text-blue-600">
                        {blog.author.username.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <FiUser className="text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{blog.author?.username || "Anonymous"}</h3>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Post Content */}
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2 text-gray-800">{blog.title}</h3>
                <p className="text-gray-700 mb-4 whitespace-pre-line">{blog.content}</p>
                
                {blog.image && (
                  <img
                    src={`http://localhost:4000/${blog.image}`}
                    alt="Blog"
                    className="w-full max-h-96 object-contain rounded-lg mb-4"
                  />
                )}
              </div>
              
              {/* Post Actions */}
              <div className="px-4 py-2 border-t border-gray-100 flex justify-between">
                <button
                  onClick={() => handleLike(blog._id)}
                  className={`flex items-center px-4 py-2 rounded-lg ${blog.likes?.includes(user?._id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                >
                  <FiHeart className="mr-2" />
                  <span>{blog.likes?.length || 0} Likes</span>
                </button>
                
                <button className="flex items-center px-4 py-2 rounded-lg text-gray-500 hover:text-blue-500">
                  <FiMessageSquare className="mr-2" />
                  <span>{blog.comments?.length || 0} Comments</span>
                </button>
                
              </div>
              
              {/* Comments Section */}
              <div className="px-4 py-2 bg-gray-50">
                <div className="flex mb-4">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText[blog._id] || ''}
                    onChange={(e) =>
                      setCommentText({ ...commentText, [blog._id]: e.target.value })
                    }
                    className="flex-1 p-2 border border-gray-200 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleComment(blog._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                  >
                    Post
                  </button>
                </div>
                
                {blog.comments?.length > 0 && (
                  <div className="space-y-3">
                    {blog.comments.map((c, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1">
                          {c.user?.username ? (
                            <span className="text-xs font-semibold">
                              {c.user.username.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <FiUser className="text-gray-600" size={14} />
                          )}
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm flex-1">
                          <div className="flex items-center mb-1">
                            <span className="font-semibold text-sm mr-2">
                              {c.user?.username || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-gray-800 text-sm">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-500">
              {user ? "Be the first to share your thoughts!" : "Sign in to create the first post!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;