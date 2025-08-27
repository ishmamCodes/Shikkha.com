import React, { useState, useEffect } from 'react';
import { uploadMaterial, getEducatorMaterials, deleteMaterial, updateMaterial } from '../../../api/materialApi.js';
import { getEducatorCourses } from '../services/educatorApi.js';
import { useUser } from '../../../context/UserContext';
import { toast } from 'react-hot-toast';

const MaterialsPage = () => {
  const { user } = useUser();
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    courseId: '',
    contentType: '',
    isPublic: true,
    tags: '',
    file: null
  });

  useEffect(() => {
    fetchMaterials();
    fetchCourses();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await getEducatorMaterials(selectedCourse);
      setMaterials(response.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      if (!user?._id) return;
      const response = await getEducatorCourses(user._id);
      setCourses(response.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file: file,
        title: prev.title || file.name
      }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('courseId', uploadForm.courseId);
      formData.append('contentType', uploadForm.contentType);
      formData.append('isPublic', uploadForm.isPublic);
      formData.append('tags', uploadForm.tags);

      await uploadMaterial(formData);
      toast.success('Material uploaded successfully!');
      
      // Reset form
      setUploadForm({
        title: '',
        description: '',
        courseId: '',
        contentType: '',
        isPublic: true,
        tags: '',
        file: null
      });
      setShowUploadForm(false);
      
      // Refresh materials
      fetchMaterials();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      await deleteMaterial(materialId);
      toast.success('Material deleted successfully');
      fetchMaterials();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete material');
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial({
      ...material,
      tags: material.tags ? material.tags.join(', ') : ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        title: editingMaterial.title,
        description: editingMaterial.description,
        isPublic: editingMaterial.isPublic,
        tags: editingMaterial.tags
      };

      await updateMaterial(editingMaterial._id, updateData);
      toast.success('Material updated successfully');
      setEditingMaterial(null);
      fetchMaterials();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update material');
    }
  };

  const getFileIcon = (contentType) => {
    switch (contentType) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'doc': return '📝';
      case 'presentation': return '📊';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Course Materials</h1>
              <p className="text-gray-600 mt-2">Upload and manage learning materials for your courses</p>
            </div>
            <button
              onClick={() => setShowUploadForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <span>📤</span>
              Upload Material
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Filter by Course:</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                fetchMaterials();
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Upload Material</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.mp3,.wav"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select
                    value={uploadForm.courseId}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Course (Optional)</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., lecture, assignment, reference"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={uploadForm.isPublic}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">Make available to students</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Form Modal */}
        {editingMaterial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Material</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingMaterial.title}
                    onChange={(e) => setEditingMaterial(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingMaterial.description}
                    onChange={(e) => setEditingMaterial(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editingMaterial.tags}
                    onChange={(e) => setEditingMaterial(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsPublic"
                    checked={editingMaterial.isPublic}
                    onChange={(e) => setEditingMaterial(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="editIsPublic" className="text-sm text-gray-700">Make available to students</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingMaterial(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Materials List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Your Materials ({materials.length})</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Materials Yet</h3>
              <p className="text-gray-600 mb-4">Start by uploading your first learning material</p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Upload Material
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {materials.map((material) => (
                <div key={material._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{getFileIcon(material.contentType)}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{material.title}</h3>
                        {material.description && (
                          <p className="text-gray-600 mt-1">{material.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          <span>📁 {material.courseId?.title || 'No Course'}</span>
                          <span>📏 {formatFileSize(material.fileSize)}</span>
                          <span>📅 {new Date(material.createdAt).toLocaleDateString()}</span>
                          <span>{material.isPublic ? '🌍 Public' : '🔒 Private'}</span>
                        </div>
                        {material.tags && material.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {material.tags.map((tag, index) => (
                              <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(material)}
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(material._id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialsPage;
