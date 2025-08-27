import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserGraduate, FaBook, FaBlog, FaShoppingCart, FaChartLine } from 'react-icons/fa';
import axios from 'axios';

const WebsiteAnalytics = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalEducators: 0,
    totalCourses: 0,
    totalBooks: 0,
    totalBlogs: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${adminToken}` };
      
      // Fetch all analytics data in parallel
      const [studentsRes, educatorsRes, coursesRes, booksRes, blogsRes, ordersRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/students/`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/educators`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/courses`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/marketplace/books`, { headers }).catch(() => ({ data: { books: [] } })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/blogs`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/marketplace/orders`, { headers }).catch(() => ({ data: [] }))
      ]);

      const students = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      const educators = Array.isArray(educatorsRes.data) ? educatorsRes.data : [];
      const courses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
      const books = Array.isArray(booksRes.data?.books) ? booksRes.data.books : (Array.isArray(booksRes.data) ? booksRes.data : []);
      const blogs = Array.isArray(blogsRes.data) ? blogsRes.data : [];
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];

      // Calculate total sales
      const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);

      setStats({
        totalStudents: students.length,
        totalEducators: educators.length,
        totalCourses: courses.length,
        totalBooks: books.length,
        totalBlogs: blogs.length,
        totalSales: totalSales
      });

      // Generate monthly trends data
      generateMonthlyTrends(students, educators, courses, books, blogs, orders);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrends = (students, educators, courses, books, blogs, orders) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyTrends = months.map((month, index) => {
      // Filter data by month (this is a simplified version - in real app you'd use actual dates)
      const monthStudents = students.filter(item => 
        item.createdAt && new Date(item.createdAt).getMonth() === index && new Date(item.createdAt).getFullYear() === currentYear
      ).length;
      
      const monthEducators = educators.filter(item => 
        item.createdAt && new Date(item.createdAt).getMonth() === index && new Date(item.createdAt).getFullYear() === currentYear
      ).length;
      
      const monthCourses = courses.filter(item => 
        item.createdAt && new Date(item.createdAt).getMonth() === index && new Date(item.createdAt).getFullYear() === currentYear
      ).length;

      return {
        month,
        students: monthStudents,
        educators: monthEducators,
        courses: monthCourses
      };
    });

    setMonthlyData(monthlyTrends);
  };

  const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? '...' : typeof value === 'number' && title.includes('Sales') ? `$${value.toLocaleString()}` : value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const SimpleChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.students + d.educators + d.courses));
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.slice(-6).map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="w-8 text-sm text-gray-600">{item.month}</span>
              <div className="flex-1 flex gap-1">
                <div 
                  className="bg-blue-500 h-6 rounded"
                  style={{ width: `${(item.students / maxValue) * 100}%`, minWidth: '2px' }}
                  title={`Students: ${item.students}`}
                />
                <div 
                  className="bg-green-500 h-6 rounded"
                  style={{ width: `${(item.educators / maxValue) * 100}%`, minWidth: '2px' }}
                  title={`Educators: ${item.educators}`}
                />
                <div 
                  className="bg-purple-500 h-6 rounded"
                  style={{ width: `${(item.courses / maxValue) * 100}%`, minWidth: '2px' }}
                  title={`Courses: ${item.courses}`}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {item.students + item.educators + item.courses}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Students</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Educators</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>Courses</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Website Analytics</h1>
        <button
          onClick={fetchAnalyticsData}
          disabled={loading}
          className="px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={FaUserGraduate}
          title="Total Students"
          value={stats.totalStudents}
          color="#3B82F6"
          bgColor="bg-blue-500"
        />
        <StatCard
          icon={FaUsers}
          title="Total Educators"
          value={stats.totalEducators}
          color="#10B981"
          bgColor="bg-green-500"
        />
        <StatCard
          icon={FaBook}
          title="Total Courses"
          value={stats.totalCourses}
          color="#8B5CF6"
          bgColor="bg-purple-500"
        />
        <StatCard
          icon={FaBook}
          title="Total Books"
          value={stats.totalBooks}
          color="#F59E0B"
          bgColor="bg-yellow-500"
        />
        <StatCard
          icon={FaBlog}
          title="Total Blogs"
          value={stats.totalBlogs}
          color="#EF4444"
          bgColor="bg-red-500"
        />
        <StatCard
          icon={FaShoppingCart}
          title="Marketplace Sales"
          value={stats.totalSales}
          color="#06B6D4"
          bgColor="bg-cyan-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart data={monthlyData} title="Monthly Growth Trends" />
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold">{stats.totalStudents + stats.totalEducators}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Content Items</span>
              <span className="font-semibold">{stats.totalCourses + stats.totalBooks + stats.totalBlogs}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Avg. Sales per Order</span>
              <span className="font-semibold">
                ${stats.totalSales > 0 ? (stats.totalSales / Math.max(1, stats.totalBooks)).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteAnalytics;
