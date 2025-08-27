import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';
import WebsiteAnalytics from './WebsiteAnalytics.jsx';
import ManageEducators from './ManageEducators.jsx';
import ManageStudents from './ManageStudents.jsx';
import AddInstructor from './AddInstructor.jsx';
import ManageBlogs from './ManageBlogs.jsx';
import ManageBooks from './ManageBooks.jsx';
import SalesPage from './SalesPage.jsx';
import logo from '../../../assets/logo.png';

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
    if (!adminToken || !adminUser || adminUser.role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      <AdminSidebar />
      <main className="flex-1 p-0 md:p-8 bg-white">
        <HeaderBar />
        <div className="p-6">
          <Routes>
            <Route index element={<WebsiteAnalytics />} />
            <Route path="educators" element={<ManageEducators />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="add-instructor" element={<AddInstructor />} />
            <Route path="blogs" element={<ManageBlogs />} />
            <Route path="books" element={<ManageBooks />} />
            <Route path="sales" element={<SalesPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

const HeaderBar = () => {
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
  const displayName = adminUser?.fullName || 'Administrator';
  const initial = displayName?.[0]?.toUpperCase();

  return (
    <div className="w-full bg-purple-800 text-white px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Shikkha" className="w-9 h-9 rounded object-cover" />
        <span className="hidden sm:inline text-white text-base font-medium">Shikkha.com</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="font-medium">{displayName}</div>
          <div className="text-white/70 text-sm">System Administrator</div>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden text-xl font-bold">
          {initial}
        </div>
      </div>
    </div>
  );
};
