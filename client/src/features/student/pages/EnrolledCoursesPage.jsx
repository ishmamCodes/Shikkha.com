import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import studentApi from '../services/studentApi';

const EnrolledCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await studentApi.getEnrolledCourses();
      if (response.success) {
        setCourses(response.data);
        console.log('Enrolled courses:', response.data);
      } else {
        toast.error('Failed to load enrolled courses');
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      toast.error('Failed to load enrolled courses');
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">My Enrolled Courses</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaCheckCircle className="text-green-500" />
          <span>{courses.length} courses enrolled</span>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Enrolled Courses</h2>
          <p className="text-gray-600 mb-6">You haven't enrolled in any courses yet.</p>
          <Link 
            to="/courses"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <ul className="divide-y divide-gray-200">
            {courses.map((course) => (
              <li key={course._id} className="px-4 py-3 text-gray-900">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{course.title}</span>
                  <span className="text-xs text-green-600 flex items-center gap-1"><FaCheckCircle /> Enrolled</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EnrolledCoursesPage;
