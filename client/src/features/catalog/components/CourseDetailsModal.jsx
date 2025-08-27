import React, { useEffect, useState } from 'react';
import { FaUser, FaUsers, FaClock, FaCheckCircle, FaTimes, FaTag, FaSignal, FaBookOpen, FaCalendarAlt } from 'react-icons/fa';
import studentApi from '../../student/services/studentApi';
import { createCheckoutSession, enrollInFreeCourse } from '../../../api/checkoutApi';
import toast from 'react-hot-toast';
import ConfirmationDialog from '../../../components/ConfirmationDialog';
import EnrollmentForm from '../../../components/EnrollmentForm';

const CourseDetailsModal = ({ courseId, onClose, onEnrollSuccess, isEnrolled = false }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [localEnrolled, setLocalEnrolled] = useState(isEnrolled);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

  const getImageSrc = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const origin = 'http://localhost:4000';
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${origin}${path}`;
  };

  useEffect(() => {
    setLocalEnrolled(isEnrolled);
  }, [isEnrolled]);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const response = await studentApi.getCourseById(courseId);
        if (response.success) {
          setCourse(response.course);
        } else {
          toast.error(response.message || 'Failed to load course');
          onClose?.();
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        toast.error('Failed to load course');
        onClose?.();
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchCourse();
  }, [courseId, onClose]);

  const handleEnrollClick = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'student') {
      toast.error('Please log in as a student to enroll');
      return;
    }

    // For free courses, show confirmation dialog
    if (!course.price || Number(course.price) === 0) {
      setShowConfirmDialog(true);
    } else {
      // For paid courses, show enrollment form
      setShowEnrollmentForm(true);
    }
  };

  const handleConfirmEnroll = async () => {
    if (!courseId || !course) return;
    setShowConfirmDialog(false);
    setEnrolling(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Free course enrollment
      const response = await enrollInFreeCourse(courseId, user._id || user.id);
      if (response.success) {
        toast.success('🎉 You enrolled in this free course!');
        setLocalEnrolled(true);
        onEnrollSuccess?.(courseId);
      } else {
        toast.error(response.message || 'Failed to enroll');
      }
    } catch (err) {
      console.error('Error enrolling in course:', err);
      toast.error(err.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleEnrollmentSubmit = async (enrollmentInfo) => {
    if (!courseId || !course) return;
    setEnrolling(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const studentId = user?._id || user?.id;
      
      if (!studentId) {
        toast.error('Please log in to enroll in courses');
        return;
      }
      
      console.log('Creating course checkout session with:', {
        type: 'course',
        itemId: courseId,
        studentId: studentId
      });
      
      // Store enrollment info for later use
      localStorage.setItem(`enrollment_${courseId}`, JSON.stringify(enrollmentInfo));
      
      // Paid course - redirect to Stripe checkout
      const response = await createCheckoutSession('course', courseId, studentId);
      if (response.success && response.url) {
        // Redirect to Stripe checkout
        window.location.href = response.url;
        return; // Don't continue with local state updates
      } else {
        throw new Error(response.message || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error enrolling in course:', err);
      toast.error(err.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
      setShowEnrollmentForm(false);
    }
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div onClick={stop} className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full text-gray-600 hover:bg-gray-100"
        >
          <FaTimes />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : !course ? (
          <div className="p-6 text-center">
            <p className="text-gray-700">Course not found.</p>
          </div>
        ) : (
          <>
            {/* Modal Thumbnail */}
            {course?.thumbnailUrl && (
              <div className="h-56 w-full bg-gray-100 overflow-hidden">
                <img
                  src={getImageSrc(course.thumbnailUrl)}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{course.title}</h2>
              <div className="bg-purple-600 text-white text-lg font-bold px-4 py-2 rounded-lg">
                {course.price > 0 ? `$${course.price}` : 'Free'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-gray-600">
              <span className="inline-flex items-center gap-2">
                <FaTag className="text-purple-500" /> {course.category}
              </span>
              <span className="inline-flex items-center gap-2">
                <FaSignal className="text-purple-500" /> {course.difficultyLevel}
              </span>
              <span className="inline-flex items-center gap-2">
                <FaUser className="text-purple-500" /> {course.instructorName || course.instructor?.fullName || 'Unknown Instructor'}
              </span>
              <span className="inline-flex items-center gap-2">
                <FaUsers className="text-purple-500" /> {course.students?.length || 0} enrolled
              </span>
              {course.duration && (
                <span className="inline-flex items-center gap-2">
                  <FaClock className="text-purple-500" /> {course.duration}
                </span>
              )}
              {course.startDate && (
                <span className="inline-flex items-center gap-2">
                  <FaCalendarAlt className="text-purple-500" /> Starts: {new Date(course.startDate).toLocaleDateString()}
                </span>
              )}
            </div>
            
            <p className="text-gray-700 mb-8">{course.description}</p>

            <div className="mb-6">
              {localEnrolled ? (
                <div className="flex flex-col gap-3 bg-green-50 p-4 rounded-md">
                  <div className="flex items-center gap-2 text-green-700">
                    <FaCheckCircle />
                    <span className="font-semibold">You enrolled in this course</span>
                  </div>
                  {course?._id && (
                    <a
                      href={`/dashboard/student/materials/${course._id}`}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-purple-700 transition-colors text-center"
                    >
                      View Materials
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleEnrollClick}
                  disabled={enrolling}
                  className="w-full md:w-auto bg-purple-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-300"
                >
                  {enrolling ? 'Enrolling...' : `Enroll Now - ${course.price > 0 ? '$' + course.price : 'Free'}`}
                </button>
              )}
            </div>

            {course.tags && course.tags.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            </div>
          </>
        )}

        {/* Confirmation Dialog for Free Courses */}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleConfirmEnroll}
          title="Enroll in Course"
          message={`Are you sure you want to enroll in "${course?.title}"? You will gain access to all course materials and be added to the class schedule.`}
          confirmText="Yes, Enroll"
          cancelText="Cancel"
          type="success"
        />

        {/* Enrollment Form for Paid Courses */}
        {showEnrollmentForm && (
          <EnrollmentForm
            course={course}
            onSubmit={handleEnrollmentSubmit}
            onClose={() => setShowEnrollmentForm(false)}
            loading={enrolling}
          />
        )}
      </div>
    </div>
  );
};

export default CourseDetailsModal;
