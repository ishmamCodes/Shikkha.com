import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import educatorApi from '../services/educatorApi.js';
import ConfirmationModal from '../../../components/common/ConfirmationModal.jsx';

const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [editingExam, setEditingExam] = useState(null);
  const [viewingExam, setViewingExam] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    timeLimit: 60,
    dueDate: '',
    attempts: 1,
    questions: [
      {
        questionText: '',
        options: ['', ''],
        correctAnswer: '',
        points: 1
      }
    ]
  });

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsRes, coursesRes] = await Promise.all([
        educatorApi.getEducatorExams(user._id),
        educatorApi.getProfile(user._id)
      ]);
      setExams(examsRes || []);
      setCourses(coursesRes?.courses || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
    }

    // Validate questions
    for (let i = 0; i < newExam.questions.length; i++) {
      const question = newExam.questions[i];
      if (!question.questionText.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      if (question.options.some(opt => !opt.trim())) {
        toast.error(`All options for question ${i + 1} are required`);
        return;
      }
      if (!question.correctAnswer || !question.options.includes(question.correctAnswer)) {
        toast.error(`Please select a valid correct answer for question ${i + 1}`);
        return;
      }
    }

    try {
      const examData = {
        courseId: selectedCourse,
        educatorId: user._id,
        title: newExam.title,
        description: newExam.description,
        questions: newExam.questions,
        timeLimit: parseInt(newExam.timeLimit),
        dueDate: newExam.dueDate ? new Date(newExam.dueDate).toISOString() : null,
        attempts: parseInt(newExam.attempts)
      };

      if (editingExam) {
        await educatorApi.updateExam(editingExam._id, examData);
        toast.success('Exam updated successfully');
      } else {
        await educatorApi.createExam(examData);
        toast.success('Exam created successfully');
      }
      
      setShowExamModal(false);
      resetExamForm();
      loadData();
    } catch (error) {
      toast.error(editingExam ? 'Failed to update exam' : 'Failed to create exam');
      console.error('Create/Update exam error:', error);
    }
  };

  const resetExamForm = () => {
    setNewExam({
      title: '',
      description: '',
      timeLimit: 60,
      dueDate: '',
      attempts: 1,
      questions: [
        {
          questionText: '',
          options: ['', ''],
          correctAnswer: ''
        }
      ]
    });
    setSelectedCourse('');
    setEditingExam(null);
  };

  const addQuestion = () => {
    setNewExam(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          options: ['', ''],
          correctAnswer: '',
          points: 1
        }
      ]
    }));
  };

  const removeQuestion = (index) => {
    if (newExam.questions.length > 1) {
      setNewExam(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  const updateQuestion = (questionIndex, field, value) => {
    setNewExam(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? { ...q, [field]: value } : q
      )
    }));
  };

  const addOption = (questionIndex) => {
    setNewExam(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? { ...q, options: [...q.options, ''] } : q
      )
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    const question = newExam.questions[questionIndex];
    if (question.options.length > 2) {
      setNewExam(prev => ({
        ...prev,
        questions: prev.questions.map((q, i) => 
          i === questionIndex ? { 
            ...q, 
            options: q.options.filter((_, oi) => oi !== optionIndex),
            correctAnswer: q.correctAnswer === q.options[optionIndex] ? '' : q.correctAnswer
          } : q
        )
      }));
    }
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setNewExam(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? { 
          ...q, 
          options: q.options.map((opt, oi) => oi === optionIndex ? value : opt)
        } : q
      )
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewExam = async (examId) => {
    try {
      const exam = await educatorApi.getExamById(examId);
      setViewingExam(exam);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load exam details');
      console.error('View exam error:', error);
    }
  };

  const handleEditExam = async (examId) => {
    try {
      const exam = await educatorApi.getExamById(examId);
      setEditingExam(exam);
      setSelectedCourse(exam.courseId._id);
      setNewExam({
        title: exam.title,
        description: exam.description,
        timeLimit: exam.timeLimit,
        dueDate: exam.dueDate ? new Date(exam.dueDate).toISOString().slice(0, 16) : '',
        attempts: exam.attempts,
        questions: exam.questions
      });
      setShowExamModal(true);
    } catch (error) {
      toast.error('Failed to load exam for editing');
      console.error('Edit exam error:', error);
    }
  };

  const handleDeleteExam = (exam) => {
    setExamToDelete(exam);
    setShowDeleteModal(true);
  };

  const confirmDeleteExam = async () => {
    if (!examToDelete) return;
    
    setIsDeleting(true);
    try {
      await educatorApi.deleteExam(examToDelete._id);
      toast.success('Exam deleted successfully');
      setShowDeleteModal(false);
      setExamToDelete(null);
      loadData();
    } catch (error) {
      toast.error('Failed to delete exam');
      console.error('Delete exam error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-800 text-lg">Loading exams...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-purple-800">Exams</h2>
        <button 
          onClick={() => setShowExamModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          {editingExam ? 'Edit Exam' : 'Create New Exam'}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <div key={exam._id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800 mb-1">{exam.title}</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                exam.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {exam.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Course:</span> {exam.courseId?.title}
              </div>
              <div>
                <span className="font-medium">Questions:</span> {exam.questions?.length || 0}
              </div>
              <div>
                <span className="font-medium">Total Points:</span> {exam.totalPoints}
              </div>
              <div>
                <span className="font-medium">Time Limit:</span> {exam.timeLimit} minutes
              </div>
              {exam.dueDate && (
                <div>
                  <span className="font-medium">Due:</span> {formatDate(exam.dueDate)}
                </div>
              )}
            </div>
            
            {exam.description && (
              <p className="text-sm text-gray-500 mt-3">{exam.description}</p>
            )}
            
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => handleViewExam(exam._id)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View
              </button>
              <button 
                onClick={() => handleEditExam(exam._id)}
                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDeleteExam(exam)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {exams.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-lg mb-2">No exams created yet</p>
          <p className="text-sm">Create your first exam to test your students' knowledge</p>
        </div>
      )}

      {/* Create Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">Create New Exam</h3>
              
              <form onSubmit={handleCreateExam} className="space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course *
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exam Title *
                    </label>
                    <input
                      type="text"
                      value={newExam.title}
                      onChange={(e) => setNewExam(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Chapter 1 Quiz"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newExam.description}
                    onChange={(e) => setNewExam(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Brief description of the exam..."
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newExam.timeLimit}
                      onChange={(e) => setNewExam(prev => ({ ...prev, timeLimit: e.target.value }))}
                      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={newExam.dueDate}
                      onChange={(e) => setNewExam(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attempts Allowed
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newExam.attempts}
                      onChange={(e) => setNewExam(prev => ({ ...prev, attempts: e.target.value }))}
                      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-800">Questions</h4>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      + Add Question
                    </button>
                  </div>

                  <div className="space-y-6">
                    {newExam.questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800">Question {questionIndex + 1}</h5>
                          {newExam.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(questionIndex)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Question Text *
                            </label>
                            <textarea
                              value={question.questionText}
                              onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                              rows={2}
                              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Enter your question here..."
                              required
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700">Options *</label>
                              <button
                                type="button"
                                onClick={() => addOption(questionIndex)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                + Add Option
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${questionIndex}`}
                                    checked={question.correctAnswer === option}
                                    onChange={() => updateQuestion(questionIndex, 'correctAnswer', option)}
                                    className="text-purple-600"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                    className="flex-1 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder={`Option ${optionIndex + 1}`}
                                    required
                                  />
                                  {question.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(questionIndex, optionIndex)}
                                      className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Select the radio button next to the correct answer
                            </p>
                          </div>

                          <div className="w-24">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Points
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={question.points}
                              onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value) || 1)}
                              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExamModal(false);
                      resetExamForm();
                    }}
                    className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    {editingExam ? 'Update Exam' : 'Create Exam'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Exam Modal */}
      {showViewModal && viewingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-800">{viewingExam.title}</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Course:</strong> {viewingExam.courseId?.title}</div>
                  <div><strong>Time Limit:</strong> {viewingExam.timeLimit} minutes</div>
                  <div><strong>Total Points:</strong> {viewingExam.totalPoints}</div>
                  <div><strong>Questions:</strong> {viewingExam.questions?.length}</div>
                </div>
                
                {viewingExam.description && (
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1 text-gray-600">{viewingExam.description}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold mb-3">Questions:</h4>
                  <div className="space-y-4">
                    {viewingExam.questions?.map((question, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <h5 className="font-medium mb-2">Q{index + 1}. {question.questionText}</h5>
                        <div className="space-y-1">
                          {question.options?.map((option, optIndex) => (
                            <div key={optIndex} className={`p-2 rounded ${
                              option === question.correctAnswer 
                                ? 'bg-green-100 text-green-800 font-medium' 
                                : 'bg-white'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {option === question.correctAnswer && ' ✓'}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Points: {question.points || 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteExam}
        title="Delete Exam"
        description={`Are you sure you want to delete "${examToDelete?.title}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ExamsPage;
