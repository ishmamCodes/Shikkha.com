import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaClock, FaCheckCircle } from 'react-icons/fa';
import { getExamById, submitExam } from '../../api/examApi';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import toast from 'react-hot-toast';

const ExamAttemptPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [examId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam) {
      // Auto-submit when time runs out
      handleSubmitExam();
    }
  }, [timeLeft, exam]);

  const fetchExam = async () => {
    try {
      const response = await getExamById(examId);
      const examData = response.data;
      setExam(examData);
      // Ensure duration is a valid number
      const duration = examData.duration && !isNaN(examData.duration) ? examData.duration : 30;
      setTimeLeft(duration * 60); // Convert minutes to seconds
    } catch (error) {
      console.error('Error fetching exam:', error);
      toast.error('Failed to load exam');
      navigate('/dashboard/student/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        toast.error('User not found. Please log in again.');
        return;
      }
      
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption
      }));

      const examData = {
        examId,
        studentId: user._id,
        answers: formattedAnswers,
        timeSpent: Math.max(0, (exam.duration * 60) - timeLeft)
      };

      const response = await submitExam(examData);
      toast.success('Exam submitted successfully!');
      navigate(`/dashboard/student/exams/${examId}/result`, { 
        state: { result: response.data } 
      });
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-300 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam not found</h2>
        <button
          onClick={() => navigate('/dashboard/student/exams')}
          className="text-purple-600 hover:text-purple-700"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Timer Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{exam.title}</h1>
              <p className="text-sm text-gray-600">{exam.courseId?.title}</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="font-medium">
                  {getAnsweredCount()}/{exam.questions?.length || 0}
                </div>
              </div>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <FaClock className="w-4 h-4" />
                <span className="font-mono text-lg font-semibold">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {exam.questions?.map((question, index) => (
            <div key={question._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Question {index + 1}
                </h3>
                <p className="text-gray-700">{question.questionText}</p>
              </div>
              
              <div className="space-y-3">
                {question.options?.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[question._id] === option
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question._id}
                      value={option}
                      checked={answers[question._id] === option}
                      onChange={() => handleAnswerChange(question._id, option)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      answers[question._id] === option
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[question._id] === option && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <FaCheckCircle className="w-5 h-5" />
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubmitExam}
        title="Submit Exam?"
        message="Are you sure? Once submitted, answers cannot be changed."
        confirmText="Submit"
        cancelText="Cancel"
        confirmButtonClass="bg-purple-600 hover:bg-purple-700 text-white"
      />
    </div>
  );
};

export default ExamAttemptPage;
