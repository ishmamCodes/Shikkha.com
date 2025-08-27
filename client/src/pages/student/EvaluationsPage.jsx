import React, { useState, useEffect } from 'react';
import { FaStar, FaUser, FaBook } from 'react-icons/fa';
import { getCompletedCourses } from '../../api/evaluationApi';
import EvaluationForm from '../../components/student/EvaluationForm';
import toast from 'react-hot-toast';

const EvaluationsPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);

  useEffect(() => {
    fetchCompletedCourses();
  }, []);

  const fetchCompletedCourses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        toast.error('User not found. Please log in again.');
        return;
      }
      const response = await getCompletedCourses(user._id);
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching completed courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleGiveEvaluation = (course) => {
    setSelectedCourse(course);
    setShowEvaluationForm(true);
  };

  const handleEvaluationSubmitted = () => {
    setShowEvaluationForm(false);
    setSelectedCourse(null);
    // Update the course to show it's been evaluated
    setCourses(prev => prev.map(course => 
      course._id === selectedCourse._id 
        ? { ...course, hasEvaluated: true }
        : course
    ));
    toast.success('Evaluation submitted successfully (anonymous)');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-300 h-48 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Evaluations</h1>
        <p className="text-gray-600">Give anonymous feedback for your completed courses</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <FaStar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No completed courses</h3>
          <p className="text-gray-500">Complete some courses to give evaluations.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {course.title}
                  </h3>
                  {course.hasEvaluated && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Already Given
                    </span>
                  )}
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaBook className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-medium">Category: {course.category}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUser className="w-4 h-4 mr-2 text-purple-500" />
                    <span>Instructor: {course.instructor?.fullName || 'Unknown'}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Completed:</span> {
                      new Date(course.completedAt || course.enrolledAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    }
                  </div>
                  
                  {course.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => handleGiveEvaluation(course)}
                  disabled={course.hasEvaluated}
                  className={`w-full py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
                    course.hasEvaluated
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <FaStar className="w-4 h-4" />
                  {course.hasEvaluated ? 'Already Given' : 'Give Evaluation'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evaluation Form Modal */}
      {showEvaluationForm && selectedCourse && (
        <EvaluationForm
          course={selectedCourse}
          onClose={() => {
            setShowEvaluationForm(false);
            setSelectedCourse(null);
          }}
          onSubmit={handleEvaluationSubmitted}
        />
      )}
    </div>
  );
};

export default EvaluationsPage;
