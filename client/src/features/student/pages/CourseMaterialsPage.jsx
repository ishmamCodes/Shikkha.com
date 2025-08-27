import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaEye, FaFileAlt, FaVideo, FaImage, FaBook } from 'react-icons/fa';
import studentApi from '../services/studentApi';
import toast from 'react-hot-toast';

const CourseMaterialsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMaterial, setPreviewMaterial] = useState(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseAndMaterials();
    }
  }, [courseId]);

  const fetchCourseAndMaterials = async () => {
    try {
      setLoading(true);
      
      // Fetch course details and materials in parallel
      const [courseResponse, materialsResponse] = await Promise.all([
        studentApi.getCourseById(courseId),
        studentApi.getCourseMaterials(courseId)
      ]);

      if (courseResponse.success) {
        setCourse(courseResponse.course);
      }

      if (materialsResponse.success) {
        setMaterials(materialsResponse.data);
      } else {
        toast.error('Failed to load materials');
      }
    } catch (error) {
      console.error('Error fetching course materials:', error);
      toast.error('Failed to load course materials');
    } finally {
      setLoading(false);
    }
  };

  const openPreview = (material) => setPreviewMaterial(material);
  const closePreview = () => setPreviewMaterial(null);

  const renderPreviewContent = (material) => {
    if (!material) return null;
    const url = material.fileUrl || material.url;
    const type = (material.fileType || '').toLowerCase();
    if (!url) return <div className="text-gray-600">No preview available.</div>;

    if (type.includes('image')) {
      return (
        <img src={url} alt={material.title} className="max-h-[70vh] max-w-full object-contain mx-auto" />
      );
    }
    if (type.includes('video')) {
      return (
        <video src={url} controls className="w-full max-h-[70vh] rounded" />
      );
    }
    if (type.includes('pdf')) {
      return (
        <iframe title={material.title} src={url} className="w-full h-[70vh] border rounded" />
      );
    }
    // Fallback for links/unknown types
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">
        Open resource
      </a>
    );
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/student/materials')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {course?.title || 'Course Materials'}
          </h1>
          {course?.instructor && (
            <p className="text-gray-600">
              Instructor: {course.instructor.fullName}
            </p>
          )}
        </div>
      </div>

      {/* Materials */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6">
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <FaBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Materials Available</h3>
              <p className="text-gray-600">
                The instructor hasn't uploaded any materials for this course yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Course Materials ({materials.length})
              </h2>
              {materials.map((material) => (
                <div
                  key={material._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(material.fileType)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{material.title}</h4>
                      {material.description && (
                        <p className="text-sm text-gray-600 mt-1">{material.description}</p>
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
                  <div className="flex items-center gap-2">
                    {(material.fileUrl || material.url) && (
                      <>
                        <button
                          onClick={() => openPreview(material)}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <a
                          href={`/api/students/courses/${courseId}/materials/${material._id}/download`}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <FaDownload />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
                <a
                  href={`/api/students/courses/${courseId}/materials/${previewMaterial._id}/download`}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Download
                </a>
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

export default CourseMaterialsPage;
