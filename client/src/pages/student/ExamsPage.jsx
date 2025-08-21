import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaCalendarAlt, FaPlay } from 'react-icons/fa';
import { getAvailableExams } from '../../api/examApi';
import toast from 'react-hot-toast';

const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        toast.error('User not found. Please log in again.');
        return;
      }
      const response = await getAvailableExams(user._id);
      setExams(response.data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/dashboard/student/exams/${examId}/attempt`);
  };

  const formatDuration = (minutes) => {
    if (!minutes || isNaN(minutes)) return 'Not specified';
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Available Exams</h1>
        <p className="text-gray-600">Take your scheduled exams below</p>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12">
          <FaPlay className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exams available</h3>
          <p className="text-gray-500">Check back later for new exams from your courses.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {exam.title}
                  </h3>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaPlay className="w-4 h-4 mr-2 text-purple-500" />
                    <span className="font-medium">{exam.courseId?.title || 'Unknown Course'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FaClock className="w-4 h-4 mr-2 text-blue-500" />
                    <span>Duration: {formatDuration(exam.duration)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FaCalendarAlt className="w-4 h-4 mr-2 text-green-500" />
                    <span>Deadline: {formatDate(exam.deadline)}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Questions:</span> {exam.questions?.length || 0}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Attempts allowed:</span> {exam.attemptsAllowed || 1}
                  </div>
                </div>
                
                {exam.hasAttempted ? (
                  <button
                    disabled
                    className="w-full bg-gray-400 text-white py-2 px-4 rounded-md cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FaPlay className="w-4 h-4" />
                    Already Taken
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartExam(exam._id)}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaPlay className="w-4 h-4" />
                    Start Exam
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamsPage;
