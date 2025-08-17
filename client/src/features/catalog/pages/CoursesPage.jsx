import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import studentApi from '../../student/services/studentApi';
import toast from 'react-hot-toast';
import CourseCard from '../components/CourseCard';
import CourseFilter from '../components/CourseFilter';
import Pagination from '../components/Pagination';
import CourseDetailsModal from '../components/CourseDetailsModal';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());

  useEffect(() => {
    const fetchCoursesAndEnrollments = async () => {
      setLoading(true);
      try {
        const params = Object.fromEntries(searchParams.entries());
        
        // Fetch courses and enrolled courses in parallel
        const [coursesResponse, enrolledResponse] = await Promise.all([
          studentApi.getCourses(params),
          studentApi.getEnrolledCourses()
        ]);
        
        if (coursesResponse.success) {
          setCourses(coursesResponse.courses);
          setPagination(coursesResponse.pagination);
        }
        
        if (enrolledResponse.success) {
          const enrolledIds = new Set(enrolledResponse.data.map(course => course._id));
          console.log('Enrolled course IDs:', Array.from(enrolledIds));
          setEnrolledCourseIds(enrolledIds);
        } else {
          console.warn('Failed to fetch enrolled courses:', enrolledResponse);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndEnrollments();
  }, [searchParams]);

  const handleFilterChange = (filters) => {
    setSearchParams(filters);
  };

  const handlePageChange = (page) => {
    setSearchParams(prev => {
      prev.set('page', page);
      return prev;
    });
  };

  const handleViewDetails = (courseId) => {
    setSelectedCourseId(courseId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCourseId(null);
  };

  const handleEnrollSuccess = (courseId) => {
    setEnrolledCourseIds(prev => new Set(prev).add(courseId));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-purple-800 text-white p-6 rounded-lg mb-8">
          <h1 className="text-3xl font-bold">Course Catalog</h1>
          <p className="mt-2 text-purple-200">Explore our wide range of courses and start learning today.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4">
            <CourseFilter onFilterChange={handleFilterChange} />
          </div>

          <div className="w-full md:w-3/4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <CourseCard.Skeleton key={i} />)}
              </div>
            ) : courses.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(course => {
                    const isEnrolled = enrolledCourseIds.has(course._id);
                    console.log(`Rendering course ${course.title} (${course._id}): enrolled=${isEnrolled}`);
                    return (
                      <CourseCard 
                        key={course._id} 
                        course={course} 
                        isEnrolled={isEnrolled}
                        onViewDetails={handleViewDetails}
                      />
                    );
                  })}
                </div>
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold">No Courses Found</h2>
                <p className="text-gray-600 mt-2">Try adjusting your filters or check back later.</p>
              </div>
            )}
          </div>
        </div>

        {showModal && selectedCourseId && (
          <CourseDetailsModal 
            courseId={selectedCourseId}
            onClose={handleCloseModal}
            onEnrollSuccess={handleEnrollSuccess}
            isEnrolled={enrolledCourseIds.has(selectedCourseId)}
          />
        )}
      </div>
    </div>
  );
};

export default CoursesPage;

