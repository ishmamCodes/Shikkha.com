import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import educatorApi from '../services/educatorApi.js';

const UploadMaterialsPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    contentType: 'text'
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const contentTypes = [
    { value: 'text', label: 'Text Document', icon: '📝' },
    { value: 'pdf', label: 'PDF Document', icon: '📄' },
    { value: 'doc', label: 'Word Document', icon: '📋' },
    { value: 'image', label: 'Image', icon: '🖼️' },
    { value: 'video', label: 'Video', icon: '🎥' },
    { value: 'audio', label: 'Audio', icon: '🎵' },
    { value: 'presentation', label: 'Presentation', icon: '📊' }
  ];

  useEffect(() => {
    if (!user) return;
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadMaterials(selectedCourse);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const profile = await educatorApi.getProfile(user._id);
      setCourses(profile?.courses || []);
    } catch (error) {
      toast.error('Failed to load courses');
      console.error('Courses load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (courseId) => {
    try {
      const materials = await educatorApi.getCourseMaterials(courseId);
      setMaterials(materials || []);
    } catch (error) {
      toast.error('Failed to load materials');
      console.error('Materials load error:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
    }

    if (!uploadForm.title.trim()) {
      toast.error('Material title is required');
      return;
    }

    if (!selectedFile && uploadForm.contentType !== 'text') {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('courseId', selectedCourse);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('contentType', uploadForm.contentType);

      const upload = await educatorApi.uploadFile(formData);
      
      // Reload materials
      await loadMaterials(selectedCourse);
      
      // Reset form
      setUploadForm({
        title: '',
        description: '',
        contentType: 'text'
      });
      setSelectedFile(null);
      
      toast.success('Material uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload material');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      await educatorApi.deleteMaterial(materialId);
      await loadMaterials(selectedCourse);
      toast.success('Material deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete material');
      console.error('Delete error:', error);
    }
  };

  const getContentTypeIcon = (type) => {
    const contentType = contentTypes.find(ct => ct.value === type);
    return contentType?.icon || '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-800 text-lg">Loading courses...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-purple-800 mb-4">Upload Course Materials</h1>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div>
          <h2 className="text-lg font-medium text-purple-800 mb-3">Upload New Material</h2>
          <form onSubmit={handleUpload} className="space-y-4 rounded-xl border p-6 bg-white shadow-sm">
            <div>
              <label className="block text-sm font-medium text-purple-800 mb-1">Select Course *</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Choose a course...</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-800 mb-1">Material Title *</label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Enter material title"
                className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-800 mb-1">Description</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Describe this material..."
                className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-800 mb-1">Content Type</label>
              <select
                value={uploadForm.contentType}
                onChange={(e) => setUploadForm(f => ({ ...f, contentType: e.target.value }))}
                className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {contentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {uploadForm.contentType !== 'text' && (
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-1">Upload File *</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  accept={
                    uploadForm.contentType === 'pdf' ? '.pdf' :
                    uploadForm.contentType === 'doc' ? '.doc,.docx' :
                    uploadForm.contentType === 'image' ? 'image/*' :
                    uploadForm.contentType === 'video' ? 'video/*' :
                    uploadForm.contentType === 'audio' ? 'audio/*' :
                    uploadForm.contentType === 'presentation' ? '.ppt,.pptx,.key' :
                    '*'
                  }
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full px-6 py-3 bg-purple-700 text-white rounded-md hover:bg-purple-800 disabled:opacity-60 transition-colors font-medium"
            >
              {uploading ? 'Uploading...' : 'Upload Material'}
            </button>
          </form>
        </div>

        {/* Materials List */}
        <div>
          <h2 className="text-lg font-medium text-purple-800 mb-3">Course Materials</h2>
          {selectedCourse ? (
            <div className="space-y-3">
              {materials.map((material) => (
                <div key={material._id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getContentTypeIcon(material.contentType)}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-purple-800">{material.title}</h3>
                        {material.description && (
                          <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Type: {material.contentType}</span>
                          {material.fileSize > 0 && (
                            <span>Size: {formatFileSize(material.fileSize)}</span>
                          )}
                          <span>Uploaded: {new Date(material.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMaterial(material._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  {material.url && (
                    <div className="mt-3">
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Material →
                      </a>
                    </div>
                  )}
                </div>
              ))}
              
              {materials.length === 0 && (
                <div className="text-center py-8 text-gray-500 border rounded-lg">
                  <div className="text-4xl mb-2">📚</div>
                  <p>No materials uploaded yet.</p>
                  <p className="text-sm">Upload materials to help your students learn better.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border rounded-lg">
              <div className="text-4xl mb-2">📖</div>
              <p>Select a course to view its materials.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadMaterialsPage;


