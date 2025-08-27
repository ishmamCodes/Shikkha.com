import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaGraduationCap, FaClock, FaBook, FaEnvelope } from 'react-icons/fa';
import studentApi from '../services/studentApi.js';
import toast from 'react-hot-toast';

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, scheduleData, gradesData] = await Promise.all([
          studentApi.getDashboardStats(),
          studentApi.getSchedule(),
          studentApi.getGrades(),
        ]);

        if (statsData.success) {
          setStats(statsData.data);
        }

        if (scheduleData.success) {
          setSchedule(scheduleData.schedule || scheduleData.data || []);
        }

        if (gradesData.success) {
          setGrades(gradesData.grades || gradesData.data || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Welcome to Your Dashboard</h1>
        <p className="text-purple-100">Track your progress, manage your courses, and stay organized.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <FaBook className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.enrolledCourses ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <FaCalendarAlt className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.upcomingAppointments ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <FaEnvelope className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Unread Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.unreadMessages ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Classes */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upcoming Classes</h2>
              <Link to="/dashboard/schedule" className="text-purple-600 hover:text-purple-800 text-sm">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {schedule.length > 0 ? (
              <div className="space-y-4">
                {schedule.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <h3 className="font-medium">{item.courseTitle}</h3>
                      <p className="text-sm text-gray-600">{item.instructor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.dayOfWeek}</p>
                      <p className="text-sm text-gray-600">{item.time}</p>
                      {item.date && (
                        <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming classes</p>
            )}
          </div>
        </div>

        {/* Recent Grades */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Grades</h2>
              <Link to="/dashboard/grades" className="text-purple-600 hover:text-purple-800 text-sm">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {grades.length > 0 ? (
              <div className="space-y-4">
                {grades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <h3 className="font-medium">{grade.courseTitle}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(grade.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        grade.grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                        grade.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {grade.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No grades available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/courses" 
            className="p-4 border-2 border-dashed border-purple-300 rounded-lg text-center hover:border-purple-500 transition-colors"
          >
            <FaBook className="text-purple-600 text-2xl mx-auto mb-2" />
            <p className="font-medium">Browse Courses</p>
            <p className="text-sm text-gray-600">Find new courses to enroll</p>
          </Link>
          <Link 
            to="/library" 
            className="p-4 border-2 border-dashed border-purple-300 rounded-lg text-center hover:border-purple-500 transition-colors"
          >
            <FaBook className="text-purple-600 text-2xl mx-auto mb-2" />
            <p className="font-medium">Visit Library</p>
            <p className="text-sm text-gray-600">Browse books and materials</p>
          </Link>
          <Link 
            to="/dashboard/profile" 
            className="p-4 border-2 border-dashed border-purple-300 rounded-lg text-center hover:border-purple-500 transition-colors"
          >
            <FaGraduationCap className="text-purple-600 text-2xl mx-auto mb-2" />
            <p className="font-medium">Update Profile</p>
            <p className="text-sm text-gray-600">Manage your information</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
