import React, { useState } from 'react';
import { FaUser, FaUsers, FaTag, FaSignal, FaClock, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { createCheckoutSession, enrollInFreeCourse } from '../../../api/checkoutApi';

const CourseCard = ({ course, isEnrolled = false, onViewDetails }) => {
  const [enrolling, setEnrolling] = useState(false);
  
  const handleEnrollment = async () => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      toast.error('Please log in to enroll in courses');
      return;
    }

    // Check if course is full
    if (course.maxStudents && course.enrolledCount >= course.maxStudents) {
      toast.error('This course is full');
      return;
    }

    setEnrolling(true);
    try {
      if (course.isPaid && course.price > 0) {
        // Paid course - redirect to Stripe (unified endpoint)
        const response = await createCheckoutSession('course', course._id, studentId);
        if (response?.success && response?.url) {
          window.location.href = response.url;
        } else {
          throw new Error(response?.message || 'Failed to start checkout');
        }
      } else {
        // Free course - enroll directly
        const response = await enrollInFreeCourse(course._id, studentId);
        if (response.success) {
          toast.success('Successfully enrolled in course!');
          // Refresh the page or update the course state
          setTimeout(() => window.location.reload(), 1000);
        }
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };
  const getImageSrc = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const origin = 'http://localhost:4000';
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${origin}${path}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
      <div className="relative">
        {course.thumbnailUrl && (
          <div className="h-40 w-full bg-gray-100 overflow-hidden">
            <img 
              src={getImageSrc(course.thumbnailUrl)} 
              alt={course.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <div className={`text-white text-sm font-bold px-3 py-1 rounded-full ${
            course.isPaid && course.price > 0 ? 'bg-green-600' : 'bg-blue-600'
          }`}>
            {course.isPaid && course.price > 0 ? `৳${Number(course.price).toFixed(0)}` : 'FREE'}
          </div>
          {course.maxStudents && (
            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full text-center">
              {course.enrolledCount || 0}/{course.maxStudents}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex-grow">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="inline-flex items-center gap-1">
              <FaTag className="text-purple-500" /> {course.category}
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1">
              <FaSignal className="text-purple-500" /> {course.difficultyLevel}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 h-14 line-clamp-2">{course.title}</h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 h-16">{course.description}</p>
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center">
            <FaUser className="mr-2 text-purple-600" />
            <span>{course.instructorName || course.instructor?.fullName || 'Unknown Instructor'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaUsers className="mr-2 text-purple-600" />
              <span>{course.enrolledCount || course.students?.length || 0} enrolled</span>
            </div>
            {course.maxStudents && (
              <span className="text-xs text-gray-500">
                {course.maxStudents - (course.enrolledCount || 0)} spots left
              </span>
            )}
          </div>
          {course.duration && (
            <div className="flex items-center">
              <FaClock className="mr-2 text-purple-600" />
              <span>{course.duration}</span>
            </div>
          )}
          {course.startDate && (
            <div className="flex items-center">
              <FaCalendarAlt className="mr-2 text-purple-600" />
              <span>Starts: {new Date(course.startDate).toLocaleDateString()}</span>
            </div>
          )}
          {(course.scheduleDays?.length || course.scheduleSlot) && (
            <div className="text-xs text-gray-500">
              {course.scheduleDays?.length ? `Schedule: ${course.scheduleDays.join(', ')}` : ''}
              {course.scheduleSlot ? ` ${course.scheduleDays?.length ? '·' : ''} Time: ${course.scheduleSlot}` : ''}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 bg-gray-50 mt-auto">
        {isEnrolled ? (
          <div className="flex flex-col gap-2">
            <div className="w-full text-center bg-green-100 text-green-700 px-4 py-2 rounded-md font-semibold">
              ✅ You enrolled in this course
            </div>
            <button
              type="button"
              onClick={() => window.location.href = `/dashboard/student/materials/${course._id}`}
              className="w-full text-center bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 transition-colors text-sm"
            >
              View Materials
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {course.maxStudents && course.enrolledCount >= course.maxStudents ? (
              <div className="w-full text-center bg-red-100 text-red-700 px-4 py-2 rounded-md font-semibold">
                Course Full
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEnrollment}
                disabled={enrolling}
                className={`w-full text-center px-4 py-2 rounded-md font-semibold transition-colors ${
                  course.isPaid && course.price > 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {enrolling ? 'Processing...' : (
                  course.isPaid && course.price > 0 ? `Enroll - ৳${Number(course.price).toFixed(0)}` : 'Enroll Free'
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => onViewDetails && onViewDetails(course._id)}
              className="block w-full text-center bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors text-sm"
            >
              View Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

CourseCard.Skeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="p-5">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
    <div className="p-5 bg-gray-50">
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

export default CourseCard;
