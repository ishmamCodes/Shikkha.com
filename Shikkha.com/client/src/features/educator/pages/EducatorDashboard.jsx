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
import logo from '../../../assets/logo.png';

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
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="upload-materials" element={<UploadMaterialsPage />} />
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
  const looksLikeEmail = (s) => typeof s === 'string' && s.includes('@');
  const toTitleFromEmail = (email) => {
    if (!email || !looksLikeEmail(email)) return '';
    const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    return base.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };
  const firstNameFrom = (name) => {
    if (!name || typeof name !== 'string') return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts[0] : '';
  };
  const initialName = (() => {
    if (!user) return 'Educator';
    if (user.name && !looksLikeEmail(user.name)) return firstNameFrom(user.name);
    if (user.fullName && !looksLikeEmail(user.fullName)) return firstNameFrom(user.fullName);
    if (user.username && !looksLikeEmail(user.username)) return firstNameFrom(user.username);
    if (user.email) return firstNameFrom(toTitleFromEmail(user.email));
    return 'Educator';
  })();
  const [displayName, setDisplayName] = React.useState(initialName);
  const [avatar, setAvatar] = React.useState('');
  React.useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const load = () => {
      import('../services/educatorApi.js').then(({ default: api }) => {
        api.getProfile(user._id).then((p) => {
          if (!isMounted) return;
          if (p?.name && !looksLikeEmail(p.name)) setDisplayName(firstNameFrom(p.name));
          if (p?.avatarUrl) {
            const url = typeof p.avatarUrl === 'string' && p.avatarUrl.startsWith('http')
              ? p.avatarUrl
              : (typeof p.avatarUrl === 'string' && p.avatarUrl.startsWith('/') ? `http://localhost:4000${p.avatarUrl}` : p.avatarUrl);
            setAvatar(url || '');
          }
        }).catch(()=>{});
      });
    };
    load();
    const onUpdated = () => load();
    window.addEventListener('educator-profile-updated', onUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('educator-profile-updated', onUpdated);
    };
  }, []);
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
          <div className="text-white/70 text-sm">{(user?.role || 'account')?.toString().charAt(0).toUpperCase() + (user?.role || 'account')?.toString().slice(1)}</div>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
          {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : initial}
        </div>
      </div>
    </div>
  );
};


