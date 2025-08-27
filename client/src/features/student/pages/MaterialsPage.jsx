import React, { useState, useEffect } from 'react';
import { FaFolderOpen, FaDownload, FaEye, FaBook, FaFileAlt, FaVideo, FaImage } from 'react-icons/fa';
import studentApi from '../services/studentApi';
import { downloadMaterial } from '../../../api/materialApi';
import toast from 'react-hot-toast';

const MaterialsPage = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState(null);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await studentApi.getEnrolledCourses();
      if (response.success) {
        setEnrolledCourses(response.data);
        if (response.data.length > 0) {
          setSelectedCourse(response.data[0]);
          fetchMaterials(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      toast.error('Failed to load enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  const openPreview = (material) => setPreviewMaterial(material);
  const closePreview = () => setPreviewMaterial(null);

  const renderPreviewContent = (material) => {
    if (!material) return null;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    const url = material.url ? `${API_BASE_URL}${material.url}` : null;
    const type = (material.fileType || '').toLowerCase();
    if (!url) return <div className="text-gray-600">No preview available.</div>;

    if (type.includes('image')) {
      return <img src={url} alt={material.title} className="max-h-[70vh] max-w-full object-contain mx-auto" />;
    }
    if (type.includes('video')) {
      return <video src={url} controls className="w-full max-h-[70vh] rounded" />;
    }
    if (type.includes('pdf')) {
      return <iframe title={material.title} src={url} className="w-full h-[70vh] border rounded" />;
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">
        Open resource
      </a>
    );
  };

  const fetchMaterials = async (courseId) => {
    setMaterialsLoading(true);
    try {
      const response = await studentApi.getCourseMaterials(courseId);
      if (response.success) {
        setMaterials(response.materials || []);
      } else {
        console.warn('Materials fetch failed:', response.message);
        setMaterials([]);
        // Don't show error toast for empty materials, it's normal
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
      toast.error('Failed to load materials');
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    fetchMaterials(course._id);
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('video')) return <FaVideo className="text-red-500" />;
    if (fileType?.includes('image')) return <FaImage className="text-green-500" />;
    if (fileType?.includes('pdf')) return <FaFileAlt className="text-red-600" />;
    return <FaFileAlt className="text-blue-500" />;
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Course Materials</h1>
        <div className="flex items-center gap-2 text-gray-600">
          <FaFolderOpen />
          <span>Access your enrolled course materials</span>
        </div>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="bg-white rounded-lg shadow border p-12 text-center">
          <FaBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Enrolled Courses</h3>
          <p className="text-gray-600 mb-6">
            You haven't enrolled in any courses yet. Enroll in courses to access their materials.
          </p>
          <button
            onClick={() => window.location.href = '/courses'}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Course Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Courses</h3>
              <div className="space-y-2">
                {enrolledCourses.map((course) => (
                  <button
                    key={course._id}
                    onClick={() => handleCourseSelect(course)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedCourse?._id === course._id
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-medium truncate">{course.title}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {course.instructor?.fullName}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Materials Content */}
          <div className="lg:col-span-3">
            {selectedCourse && (
              <div className="bg-white rounded-lg shadow border">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedCourse.title} - Materials
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Instructor: {selectedCourse.instructor?.fullName}
                  </p>
                </div>

                <div className="p-6">
                  {materialsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="text-center py-12">
                      <FaFileAlt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Materials Available</h3>
                      <p className="text-gray-600">
                        The instructor hasn't uploaded any materials for this course yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {materials.map((material) => (
                        <div
                          key={material._id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                              {getFileIcon(material.fileType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{material.title}</h4>
                              {material.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{material.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>Size: {formatFileSize(material.fileSize || 0)}</span>
                                <span>Uploaded: {new Date(material.createdAt).toLocaleDateString()}</span>
                                {material.uploadedBy?.fullName && (
                                  <span>By: {material.uploadedBy.fullName}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {material.url ? (
                              <>
                                <button
                                  onClick={() => openPreview(material)}
                                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="View"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
                                      const token = localStorage.getItem('token');
                                      
                                      const response = await fetch(`${API_BASE_URL}/api/materials/download/${material._id}`, {
                                        method: 'GET',
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                        },
                                      });

                                      if (!response.ok) {
                                        throw new Error('Download failed');
                                      }

                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = material.title + (material.fileType || '');
                                      document.body.appendChild(a);
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      document.body.removeChild(a);
                                      toast.success('Download started');
                                    } catch (error) {
                                      console.error('Download error:', error);
                                      toast.error('Failed to download file');
                                    }
                                  }}
                                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Download"
                                >
                                  <FaDownload />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 px-2">No file</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closePreview}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-[95vw] max-w-3xl mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewMaterial.title}</h3>
                {previewMaterial.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{previewMaterial.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
                      const token = localStorage.getItem('token');
                      
                      const response = await fetch(`${API_BASE_URL}/api/materials/download/${previewMaterial._id}`, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      });

                      if (!response.ok) {
                        throw new Error('Download failed');
                      }

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = previewMaterial.title + (previewMaterial.fileType || '');
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      toast.success('Download started');
                    } catch (error) {
                      console.error('Download error:', error);
                      toast.error('Failed to download file');
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Download
                </button>
                <button onClick={closePreview} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">Close</button>
              </div>
            </div>
            <div className="p-4">
              {renderPreviewContent(previewMaterial)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsPage;
