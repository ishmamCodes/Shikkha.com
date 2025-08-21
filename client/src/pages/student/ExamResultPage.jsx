import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaTrophy, FaChartLine, FaClock } from 'react-icons/fa';

const ExamResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Result not found</h2>
        <button
          onClick={() => navigate('/dashboard/student/exams')}
          className="text-purple-600 hover:text-purple-700"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 80) return 'Excellent work!';
    if (percentage >= 60) return 'Good job!';
    return 'Keep practicing!';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-12 text-center text-white">
            <FaTrophy className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Exam Completed!</h1>
            <p className="text-purple-100">Here are your results</p>
          </div>

          {/* Results */}
          <div className="px-8 py-8">
            <div className="text-center mb-8">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.percentage)}`}>
                {Math.round(result.percentage)}%
              </div>
              <p className="text-xl text-gray-600 mb-4">
                {getScoreMessage(result.percentage)}
              </p>
              <p className="text-gray-500">
                You scored {result.score} out of {result.totalQuestions} questions correctly
              </p>
            </div>

            {/* Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <FaChartLine className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Score</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {result.score}/{result.totalQuestions}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <FaClock className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Time Taken</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatTime(result.timeSpent || 0)}
                </p>
              </div>
            </div>

            {/* Exam Info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Exam Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Exam:</span>
                  <span className="font-medium">{result.examTitle || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Course:</span>
                  <span className="font-medium">{result.courseTitle || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">
                    {new Date(result.submittedAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Attempt:</span>
                  <span className="font-medium">{result.attemptNumber || 1}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/dashboard/student/grades')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                View All Grades
              </button>
              <button
                onClick={() => navigate('/dashboard/student/exams')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResultPage;
