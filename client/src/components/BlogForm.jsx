import React, { useState } from 'react';

const BlogForm = ({ onPostSubmit }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');

  const handlePost = async () => {
    if (!user || !token) {
      setError('You must be logged in to post.');
      return;
    }

    if (!content.trim()) {
      setError('Post content cannot be empty.');
      return;
    }

    const form = new FormData();
    form.append('title', 'Untitled'); // default title
    form.append('content', content);
    if (image) form.append('image', image);

    const res = await fetch('http://localhost:5000/api/blogs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    

    if (res.ok) {
      setContent('');
      setImage(null);
      setError('');
      onPostSubmit();
    } else {
      setError('Failed to post.');
    }
  };

  return (
    <div className="mb-6">
      <textarea
        rows="4"
        placeholder="Write your blog post..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <button onClick={handlePost} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
        Post
      </button>
      {error && <p className="text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default BlogForm;
