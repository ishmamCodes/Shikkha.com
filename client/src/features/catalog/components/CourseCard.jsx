import React from 'react';
import { FaUser, FaUsers, FaTag, FaSignal, FaClock, FaCalendarAlt } from 'react-icons/fa';

const CourseCard = ({ course, isEnrolled = false, onViewDetails }) => {
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
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full">
          {course.price > 0 ? `$${course.price}` : 'Free'}
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
          <div className="flex items-center">
            <FaUsers className="mr-2 text-purple-600" />
            <span>{course.students?.length || 0} enrolled</span>
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
          <button
            type="button"
            onClick={() => onViewDetails && onViewDetails(course._id)}
            className="block w-full text-center bg-purple-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-purple-700 transition-colors"
          >
            View Details
          </button>
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

