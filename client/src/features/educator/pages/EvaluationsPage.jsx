import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import educatorApi from '../services/educatorApi.js';
import EvaluationCard from '../../../components/educator/EvaluationCard.jsx';

const EvaluationsPage = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState({
    overallAverage: 0,
    totalEvaluations: 0,
    courseAverages: []
  });
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) return;
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const response = await educatorApi.getEducatorEvaluations(user._id);
      setEvaluations(response.evaluations || []);
      setStats(response.stats || {
        overallAverage: 0,
        totalEvaluations: 0,
        courseAverages: []
      });
    } catch (error) {
      toast.error('Failed to load evaluations');
      console.error('Evaluations load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${
          index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-800 text-lg">Loading evaluations...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-purple-800 mb-2">Course Evaluations</h1>
        <p className="text-gray-600">See what your students think about your courses</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall Rating */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Overall Rating</h3>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl font-bold text-purple-800">
              {stats.overallAverage || 0}
            </span>
            <div className="flex items-center">
              {renderStars(stats.overallAverage || 0)}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Based on {stats.totalEvaluations} evaluation{stats.totalEvaluations !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Total Evaluations */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Total Feedback</h3>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-blue-800">
              {stats.totalEvaluations}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Student evaluations received
          </p>
        </div>

        {/* Best Course */}
        {stats.courseAverages && stats.courseAverages.length > 0 && (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Top Rated Course</h3>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {(() => {
              const topCourse = stats.courseAverages.reduce((best, current) => 
                parseFloat(current.average) > parseFloat(best.average) ? current : best
              );
              return (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-green-800">
                      {topCourse.average}
                    </span>
                    <div className="flex items-center">
                      {renderStars(parseFloat(topCourse.average))}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {topCourse.courseName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {topCourse.count} evaluation{topCourse.count !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Course Averages */}
      {stats.courseAverages && stats.courseAverages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Course Ratings</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="divide-y">
              {stats.courseAverages.map((course) => (
                <div key={course.courseId} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                    <p className="text-sm text-gray-500">
                      {course.count} evaluation{course.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      {renderStars(parseFloat(course.average))}
                    </div>
                    <span className="text-lg font-semibold text-purple-800 min-w-[3rem] text-right">
                      {course.average}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Individual Evaluations */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Recent Feedback ({evaluations.length})
        </h2>
        
        {evaluations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {evaluations.map((evaluation) => (
              <EvaluationCard key={evaluation._id} evaluation={evaluation} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg mb-2">No evaluations yet</p>
            <p className="text-sm">
              Students will be able to leave feedback once they complete your courses
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationsPage;
