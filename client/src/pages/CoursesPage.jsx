import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiUser, FiClock, FiDollarSign, FiUsers, FiMessageSquare, FiBookOpen, FiStar, FiHeart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession, enrollInFreeCourse } from '../api/checkoutApi';

const CoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState({ show: false, type: 'success', text: '' });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsCourse, setDetailsCourse] = useState(null);
  const [confirmEnrollCourse, setConfirmEnrollCourse] = useState(null);

  const getImageSrc = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const origin = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${origin}${path}`;
  };

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  // Configure axios
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const categories = [
    'Mathematics', 'Science', 'Language', 'History', 
    'Computer Science', 'Arts', 'Music', 'Physical Education', 'Other'
  ];

  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedCategory, selectedDifficulty]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (course) => {
    try {
      // Optionally refetch full details
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/courses/${course._id}`);
      setDetailsCourse(res.data || course);
    } catch (e) {
      // Fallback to given course if fetch fails
      setDetailsCourse(course);
    } finally {
      setDetailsOpen(true);
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsCourse(null);
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((course.instructorName || course.instructor?.fullName || '')).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(course => course.difficultyLevel === selectedDifficulty);
    }

    setFilteredCourses(filtered);
  };

  const handleEnroll = async (courseId) => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    if (user.role !== 'student') {
      alert('Only students can enroll in courses');
      return;
    }

    // Use modern confirmation modal instead of window.confirm
    const target = courses.find(c => c._id === courseId) || detailsCourse;
    setConfirmEnrollCourse(target);
    return; // actual enroll will be triggered from modal confirm

  };

  const performEnroll = async (courseId) => {
    try {
      setEnrollingCourseId(courseId);
      const course = courses.find(c => c._id === courseId) || detailsCourse;
      
      if (!course) {
        throw new Error('Course not found');
      }

      // Get student ID - try multiple possible fields
      const studentId = user?.id || user?._id || localStorage.getItem('studentId');
      if (!studentId) {
        throw new Error('Student ID not found. Please log in again.');
      }

      console.log('Course enrollment:', { courseId, studentId, isPaid: course.isPaid, price: course.price });

      // Check if course is free
      if (!course.isPaid || course.price === 0) {
        // Free course enrollment
        const response = await enrollInFreeCourse(courseId, studentId);
        showToast('Successfully enrolled in free course!', 'success');
        
        // Update the courses list
        setCourses(prevCourses =>
          prevCourses.map(c =>
            c._id === courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c
          )
        );
      } else {
        // Paid course - redirect to Stripe checkout
        console.log('Creating checkout session for paid course...');
        const response = await createCheckoutSession('course', courseId, studentId);
        console.log('Checkout response:', response);
        
        if (response.success && response.url) {
          // Redirect to Stripe checkout
          window.location.href = response.url;
          return; // Don't continue with local state updates
        } else {
          throw new Error('Failed to create checkout session');
        }
      }
      
      // If details modal is open for this course, sync it too
      if (detailsOpen && detailsCourse?._id === courseId) {
        setDetailsCourse(prev => ({ ...prev, enrolledCount: (prev.enrolledCount || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      showToast(error.response?.data?.message || error.message || 'Failed to enroll in course', 'error');
    } finally {
      setEnrollingCourseId(null);
      setConfirmEnrollCourse(null);
    }
  };

  const handleUnenroll = async (courseId) => {
    try {
      setEnrollingCourseId(courseId);
      const response = await axios.post(`/api/courses/${courseId}/unenroll`);
      
      // Update the courses list
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course._id === courseId ? response.data.course : course
        )
      );
      
      alert('Successfully unenrolled from course!');
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      alert(error.response?.data?.error || 'Failed to unenroll from course');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleMessageInstructor = (instructor) => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    // Open one-time message modal
    setMessageTarget(instructor);
  };

  const showToast = (text, type = 'success') => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  const isEnrolled = (course) => {
    return course.students?.some(student => student._id === user?._id);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Mathematics': return '🔢';
      case 'Science': return '🔬';
      case 'Language': return '📚';
      case 'History': return '🏛️';
      case 'Computer Science': return '💻';
      case 'Arts': return '🎨';
      case 'Music': return '🎵';
      case 'Physical Education': return '🏃';
      default: return '📖';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Explore Courses
          </h1>
          <p className="text-xl text-white/80">
            Discover amazing courses from expert educators
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category} className="text-gray-800">
                  {category}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="">All Levels</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty} className="text-gray-800">
                  {difficulty}
                </option>
              ))}
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-white/20 rounded-xl px-4 py-3">
              <span className="text-white font-medium">
                {filteredCourses.length} courses found
              </span>
            </div>
          </div>
        </motion.div>

        {/* Courses Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 shadow-xl"
              >
                {/* Thumbnail */}
                {course.thumbnailUrl && (
                  <div className="h-40 w-full bg-black/10 overflow-hidden">
                    <img 
                      src={getImageSrc(course.thumbnailUrl)} 
                      alt={course.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                {/* Course Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getCategoryIcon(course.category)}</span>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {course.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficultyLevel)}`}>
                          {course.difficultyLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-white/80 text-sm mb-4 line-clamp-3">
                    {course.description || 'No description available'}
                  </p>

                  {/* Course Stats */}
                  <div className="flex items-center gap-4 text-sm text-white/70 mb-4">
                    <div className="flex items-center gap-1">
                      <FiUsers />
                      <span>{course.students?.length || 0} students</span>
                    </div>
                    {course.duration && (
                      <div className="flex items-center gap-1">
                        <FiClock />
                        <span>{course.duration}</span>
                      </div>
                    )}
                    {(course?.schedule?.days?.length || course?.scheduleDays?.length) && (
                      <div className="hidden md:flex items-center gap-1 truncate max-w-[12rem]">
                        <span>•</span>
                        <span className="truncate">{(course.schedule?.days || course.scheduleDays).join(' • ')}</span>
                      </div>
                    )}
                    {(course?.schedule?.time || course?.scheduleTime) && (
                      <div className="flex items-center gap-1">
                        <span>•</span>
                        <span>{course.schedule?.time || course.scheduleTime}</span>
                      </div>
                    )}
                    {course.price > 0 && (
                      <div className="flex items-center gap-1">
                        <FiDollarSign />
                        <span>${course.price}</span>
                      </div>
                    )}
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                        <FiUser className="text-white text-sm" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {course.instructorName || course.instructor?.fullName || 'Unknown'}
                        </p>
                        <p className="text-white/60 text-xs capitalize">
                          {course.instructor?.role || 'Educator'}
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleMessageInstructor(course.instructor)}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <FiMessageSquare className="text-white" />
                    </motion.button>
                  </div>
                </div>

                {/* Course Actions */}
                <div className="px-6 pb-6">
                  {isEnrolled(course) && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium">
                      You enrolled in this course
                    </div>
                  )}
                  {user?.role === 'student' ? (
                    <div className="flex gap-2">
                      {isEnrolled(course) ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openDetails(course)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                          >
                            View Details
                          </motion.button>
                        </>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleEnroll(course._id)}
                            disabled={enrollingCourseId === course._id}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                          >
                            {enrollingCourseId === course._id ? 'Enrolling...' : 'Enroll Now'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openDetails(course)}
                            className="px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                          >
                            View Details
                          </motion.button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium"
                      disabled
                    >
                      {user ? 'Students Only' : 'Login to Enroll'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-white mb-2">No courses found</h3>
            <p className="text-white/70">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>

    {/* Course Details Modal */}
    <AnimatePresence>
      {detailsOpen && detailsCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeDetails}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Modal Thumbnail */}
            {detailsCourse.thumbnailUrl && (
              <div className="h-56 w-full bg-gray-100 overflow-hidden">
                <img 
                  src={getImageSrc(detailsCourse.thumbnailUrl)} 
                  alt={detailsCourse.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{detailsCourse.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{detailsCourse.category} • {detailsCourse.difficultyLevel}</p>
                </div>
                <button onClick={closeDetails} className="px-3 py-1 rounded-lg border hover:bg-gray-50">Close</button>
              </div>

              <p className="text-gray-700 mb-4">{detailsCourse.description || 'No description available.'}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-6">
                <div className="flex items-center gap-2">
                  <FiUsers />
                  <span>{detailsCourse.students?.length || 0} students</span>
                </div>
                {detailsCourse.duration && (
                  <div className="flex items-center gap-2">
                    <FiClock />
                    <span>{detailsCourse.duration}</span>
                  </div>
                )}
                {(detailsCourse?.schedule?.days?.length || detailsCourse?.scheduleDays?.length) && (
                  <div className="flex items-center gap-2">
                    <span>•</span>
                    <span className="truncate max-w-[16rem]">{(detailsCourse.schedule?.days || detailsCourse.scheduleDays).join(' • ')}</span>
                  </div>
                )}
                {(detailsCourse?.schedule?.time || detailsCourse?.scheduleTime) && (
                  <div className="flex items-center gap-2">
                    <span>•</span>
                    <span>{detailsCourse.schedule?.time || detailsCourse.scheduleTime}</span>
                  </div>
                )}
                {typeof detailsCourse.price === 'number' && detailsCourse.price > 0 && (
                  <div className="flex items-center gap-2">
                    <FiDollarSign />
                    <span>${detailsCourse.price}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Instructor: <span className="font-medium text-gray-800">{detailsCourse.instructorName || detailsCourse.instructor?.fullName || 'Unknown'}</span>
                </div>
                {isEnrolled(detailsCourse) ? (
                  <div className="px-4 py-2 rounded-xl bg-green-100 text-green-700 font-medium">You enrolled in this course</div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setConfirmEnrollCourse(detailsCourse)}
                    disabled={enrollingCourseId === detailsCourse._id}
                    className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium disabled:opacity-50"
                  >
                    {enrollingCourseId === detailsCourse._id ? 'Enrolling...' : 'Enroll Now'}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Confirm Enroll Modal */}
    <AnimatePresence>
      {confirmEnrollCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmEnrollCourse(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm Enrollment</h3>
              <p className="text-gray-600 mb-6">Do you want to enroll in <span className="font-medium">{confirmEnrollCourse.title}</span>?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmEnrollCourse(null)}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => performEnroll(confirmEnrollCourse._id)}
                  className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Yes, Enroll
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* One-time Message Modal */}
    <AnimatePresence>
      {messageTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-semibold mb-2">Message {messageTarget.fullName}</h3>
            <p className="text-sm text-gray-600 mb-4">Send an introductory message. This will create a conversation in Messenger.</p>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              className="w-full border rounded-xl p-3 mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Write your message..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setMessageTarget(null); setMessageText(''); }}
                className="px-4 py-2 rounded-lg border"
                disabled={sending}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={sending || !messageText.trim()}
                onClick={async () => {
                  if (!messageText.trim()) return;
                  try {
                    setSending(true);
                    const res = await axios.post('/api/messages', {
                      receiverId: messageTarget._id,
                      content: messageText.trim(),
                    });
                    setMessageTarget(null);
                    setMessageText('');
                    showToast('Message sent successfully');
                    navigate('/messenger', { state: { selectedUser: messageTarget } });
                  } catch (err) {
                    console.error('Send message failed', err);
                    const msg = err?.response?.data?.error || 'Failed to send message';
                    showToast(msg, 'error');
                  } finally {
                    setSending(false);
                  }
                }}
                className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Send & Open Messenger'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Toast */}
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, x: 50, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className={`fixed top-5 right-5 z-[60] px-4 py-3 rounded-xl shadow-xl text-sm ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
        >
          {toast.text}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default CoursesPage;
