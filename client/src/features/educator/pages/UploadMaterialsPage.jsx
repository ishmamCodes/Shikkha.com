import React, { useEffect, useState } from 'react';
import educatorApi from '../services/educatorApi.js';

const UploadMaterialsPage = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    educatorApi.getProfile(user._id).then((profile) => {
      setCourses(profile?.courses || []);
    });
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (courseId) formData.append('courseId', courseId);
      const res = await educatorApi.uploadFile(formData);
      setMessage(`Uploaded: ${res.url}`);
      setFile(null);
      (document.getElementById('fileInput') || {}).value = '';
    } catch (e) {
      setMessage('Upload failed');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-purple-800 mb-4">Upload Materials</h1>
      <form onSubmit={handleUpload} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-purple-800 mb-1">Select Course (optional)</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full border rounded-md p-2">
            <option value="">None</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>
        <div>
          <input id="fileInput" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block" />
        </div>
        <button className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800">Upload</button>
      </form>
      {message && <p className="text-purple-800 mt-3">{message}</p>}
    </div>
  );
};

export default UploadMaterialsPage;


