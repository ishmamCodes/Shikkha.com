import React, { useState } from 'react';
import educatorApi from '../services/educatorApi.js';

const CreateCoursePage = () => {
  const [form, setForm] = useState({ title: '', description: '', privacy: 'public' });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');
    try {
      const course = await educatorApi.createCourse(form);
      setMessage(`Created: ${course.title}`);
      setForm({ title: '', description: '', privacy: 'public' });
    } catch (e) {
      setMessage('Failed to create');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-purple-800 mb-4">Create Course</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl rounded-xl border p-4 bg-white shadow-sm">
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Title</label>
          <input required name="title" value={form.title} onChange={handleChange} className="w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded-md p-2" rows={4} />
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Privacy</label>
          <select name="privacy" value={form.privacy} onChange={handleChange} className="w-full border rounded-md p-2">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <button disabled={creating} className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 disabled:opacity-60">{creating ? 'Creating...' : 'Create'}</button>
      </form>
      {message && <p className="text-purple-800 mt-3">{message}</p>}
    </div>
  );
};

export default CreateCoursePage;


