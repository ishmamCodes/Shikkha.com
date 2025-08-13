import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import EducatorSidebar from '../components/EducatorSidebar.jsx';
import DashboardHome from './DashboardHome.jsx';
import ProfilePage from './ProfilePage.jsx';
import CreateCoursePage from './CreateCoursePage.jsx';
import ManageCoursesPage from './ManageCoursesPage.jsx';
import AppointmentsPage from './AppointmentsPage.jsx';
import UploadMaterialsPage from './UploadMaterialsPage.jsx';
import SettingsPage from './SettingsPage.jsx';
import ComingSoon from './ComingSoon.jsx';

const EducatorDashboard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token || !user || user.role !== 'educator') {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      <EducatorSidebar />
      <main className="flex-1 p-0 md:p-8 bg-white">
        <HeaderBar />
        <div className="p-6">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="create-course" element={<CreateCoursePage />} />
          <Route path="manage-courses" element={<ManageCoursesPage />} />
          <Route path="appointments" element={<ComingSoon title="Messages & Earnings (Coming Soon)" />} />
          <Route path="upload-materials" element={<ComingSoon title="Upload Materials (Coming Soon)" />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
        </div>
      </main>
    </div>
  );
};

export default EducatorDashboard;

const HeaderBar = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [displayName, setDisplayName] = React.useState(user?.username || 'Educator');
  const [avatar, setAvatar] = React.useState('');
  React.useEffect(() => {
    if (!user) return;
    // try to load educator profile for full name and avatar
    import('../services/educatorApi.js').then(({ default: api }) => {
      api.getProfile(user._id).then((p) => {
        if (p?.name) setDisplayName(p.name);
        if (p?.avatarUrl) setAvatar(p.avatarUrl);
      }).catch(()=>{});
    });
  }, []);
  const initial = displayName?.[0]?.toUpperCase();
  return (
    <div className="w-full bg-purple-800 text-white px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <img src="/logo.jpg" alt="Shikkha" className="w-9 h-9 rounded object-cover" />
        <span className="hidden sm:inline text-white text-base font-medium">Shikkha.com</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="font-medium">{displayName}</div>
          <div className="text-white/70 text-sm">Account</div>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
          {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : initial}
        </div>
      </div>
    </div>
  );
};


