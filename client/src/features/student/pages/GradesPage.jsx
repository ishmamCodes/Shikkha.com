import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaTrophy, FaChartLine } from 'react-icons/fa';
import studentApi from '../services/studentApi.js';
import toast from 'react-hot-toast';

const GradesPage = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await studentApi.getGrades();
        if (response.success) {
          setGrades(response.grades);
        }
      } catch (error) {
        console.error('Error fetching grades:', error);
        toast.error('Failed to load grades');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const calculateGPA = () => {
    if (grades.length === 0) return 0;
    const totalPoints = grades.reduce((sum, grade) => sum + (grade.points || 0), 0);
    return (totalPoints / grades.length).toFixed(2);
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
        <h1 className="text-2xl font-bold text-gray-900">Academic Performance</h1>
        <div className="flex items-center gap-2 text-gray-600">
          <FaGraduationCap />
          <span>Current Semester</span>
        </div>
      </div>

      {/* GPA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <FaTrophy className="text-yellow-600 text-2xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Current GPA</p>
              <p className="text-2xl font-bold">{calculateGPA()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <FaChartLine className="text-green-600 text-2xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Courses Completed</p>
              <p className="text-2xl font-bold">{grades.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <FaGraduationCap className="text-purple-600 text-2xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Credits Earned</p>
              <p className="text-2xl font-bold">{grades.length * 3}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grades List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Course Grades</h2>
        </div>
        <div className="p-6">
          {grades.length > 0 ? (
            <div className="space-y-4">
              {grades.map((grade, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {grade.courseTitle}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Updated: {new Date(grade.updatedAt).toLocaleDateString()}
                    </p>
                    {grade.feedback && (
                      <p className="text-sm text-gray-700 mt-2 italic">
                        "{grade.feedback}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">GPA Points</p>
                      <p className="font-semibold">{grade.points || 'N/A'}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getGradeColor(grade.grade)}`}>
                      {grade.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaGraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Grades Yet</h3>
              <p className="text-gray-600 mb-6">
                Your grades will appear here once your instructors have graded your work.
              </p>
              <button
                onClick={() => window.location.href = '/courses'}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Enroll in Courses
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grade Distribution Chart Placeholder */}
      {grades.length > 0 && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-lg font-semibold mb-4">Grade Distribution</h2>
          <div className="text-center py-8 text-gray-500">
            <FaChartLine className="w-12 h-12 mx-auto mb-2" />
            <p>Grade distribution chart coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradesPage;
