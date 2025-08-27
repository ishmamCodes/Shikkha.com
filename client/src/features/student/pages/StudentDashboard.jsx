import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar.jsx';
import DashboardHome from './DashboardHome.jsx';
import ProfilePage from './ProfilePage.jsx';
import SchedulePage from './SchedulePage.jsx';
import GradesPage from './GradesPage.jsx';
import SettingsPage from './SettingsPage.jsx';
import ComingSoon from './ComingSoon.jsx';
import AppointmentsPage from './AppointmentsPage.jsx';
import CourseMaterialsPage from './CourseMaterialsPage.jsx';
import MaterialsPage from './MaterialsPage.jsx';
import ExamsPage from '../../../pages/student/ExamsPage.jsx';
import ExamAttemptPage from '../../../pages/student/ExamAttemptPage.jsx';
import ExamResultPage from '../../../pages/student/ExamResultPage.jsx';
import StudentGradesPage from '../../../pages/student/GradesPage.jsx';
import EvaluationsPage from '../../../pages/student/EvaluationsPage.jsx';
import MyBooksPage from './MyBooksPage.jsx';
import EnrolledCoursesPage from './EnrolledCoursesPage.jsx';
import logo from '../../../assets/logo.png';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [showHeader, setShowHeader] = useState(() => {
    const v = localStorage.getItem('studentHeaderVisible');
    return v === null ? true : v === 'true';
  });
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token || !user || user.role !== 'student') {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('studentHeaderVisible', String(showHeader));
  }, [showHeader]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      <StudentSidebar />
      <main className="flex-1 p-0 md:p-8 bg-white">
        {showHeader && <HeaderBar onToggle={() => setShowHeader(false)} />}
        {!showHeader && (
          <button
            onClick={() => setShowHeader(true)}
            className="fixed top-3 right-3 z-20 bg-purple-700 text-white px-3 py-1 rounded shadow hover:bg-purple-800"
            aria-label="Show header"
          >
            Show Header
          </button>
        )}
        <div className="p-6">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="enrolled-courses" element={<EnrolledCoursesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="exams/:examId/attempt" element={<ExamAttemptPage />} />
            <Route path="exams/:examId/result" element={<ExamResultPage />} />
            <Route path="grades" element={<StudentGradesPage />} />
            <Route path="evaluations" element={<EvaluationsPage />} />
            <Route path="books" element={<MyBooksPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="materials/:courseId" element={<CourseMaterialsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;

const HeaderBar = ({ onToggle }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [displayName, setDisplayName] = useState('Student');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    const updateUserState = () => {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser) {
        setUser(storedUser);
        setDisplayName(storedUser.fullName || storedUser.name || toTitleFromEmail(storedUser.email) || 'Student');
        setAvatar(storedUser.avatarUrl || '');
      }
    };

    updateUserState();

    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        updateUserState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const initial = displayName?.[0]?.toUpperCase();

  const toTitleFromEmail = (email) => {
    if (!email || !email.includes('@')) return '';
    const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    return base.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="w-full bg-purple-800 text-white px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Shikkha" className="w-9 h-9 rounded object-cover" />
        <span className="hidden sm:inline text-white text-base font-medium">Shikkha.com</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="font-medium">{displayName}</div>
          <div className="text-white/70 text-sm">Student Account</div>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden text-xl font-bold">
          {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : initial}
        </div>
        <button
          onClick={onToggle}
          className="ml-2 text-sm bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded"
          aria-label="Hide header"
        >
          Hide
        </button>
      </div>
    </div>
  );
};
