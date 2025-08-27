import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import studentApi from '../../student/services/studentApi';
import toast from 'react-hot-toast';
import { FaUser, FaUsers, FaClock, FaBook, FaCheckCircle } from 'react-icons/fa';
import paymentApi from '../../../api/paymentApi';
import { useUser } from '../../../context/UserContext';

const CourseDetailsPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const response = await studentApi.getCourseById(id);
        if (response.success) {
          setCourse(response.course);
          // In a real app, you'd check if the user is already enrolled
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      if (!course) return;

      // Paid course -> create Stripe Checkout Session
      if (course.isPaid && Number(course.price) > 0) {
        if (!user?._id) {
          toast.error('Please log in to enroll');
          return;
        }
        const resp = await paymentApi.createCoursePaymentSession(id, user._id);
        if (resp?.success && resp?.sessionUrl) {
          window.location.href = resp.sessionUrl;
          return;
        }
        toast.error(resp?.message || 'Failed to start payment');
        return;
      }

      // Free course -> existing flow
      const response = await paymentApi.enrollInFreeCourse(id, user?._id);
      if (response.success) {
        toast.success('Successfully enrolled!');
        setIsEnrolled(true);
      } else {
        toast.error(response.message || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Course Not Found</h2>
        <Link to="/courses" className="text-purple-600 mt-4 inline-block">Back to Courses</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
            <p className="text-gray-600 text-lg mb-6">{course.description}</p>

            <div className="flex items-center gap-6 mb-8 text-gray-700">
              <div className="flex items-center gap-2">
                <FaUser className="text-purple-600" />
                <span>Instructor: {course.instructor.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUsers className="text-purple-600" />
                <span>{course.enrollmentCount} students enrolled</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="text-purple-600" />
                <span>Approx. {course.duration || '10 hours'}</span>
              </div>
            </div>

            <div className="mb-8">
              {isEnrolled ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-100 p-4 rounded-lg">
                  <FaCheckCircle />
                  <span>You are enrolled in this course.</span>
                </div>
              ) : (
                <button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-300"
                >
                  {enrolling ? 'Processing...' : (course?.isPaid && Number(course?.price) > 0 ? `Pay with Stripe ($${Number(course.price).toFixed(2)})` : 'Enroll for Free')}
                </button>
              )}
            </div>

            <div className="border-t pt-8">
              <h2 className="text-2xl font-semibold mb-4">What you'll learn</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {course.learningObjectives && course.learningObjectives.length > 0 ? (
                  course.learningObjectives.map((obj, i) => <li key={i}>{obj}</li>)
                ) : (
                  <p>Learning objectives will be listed here.</p>
                )}
              </ul>
            </div>

            <div className="border-t pt-8 mt-8">
              <h2 className="text-2xl font-semibold mb-4">Course Content</h2>
              <div className="space-y-4">
                {course.modules && course.modules.length > 0 ? (
                  course.modules.map((module, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <h3 className="font-semibold">{module.title}</h3>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">Course content details will be available soon.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
