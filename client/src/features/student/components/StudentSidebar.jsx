import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaBook, 
  FaBookOpen, 
  FaShoppingCart, 
  FaCalendarAlt, 
  FaGraduationCap,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaFolderOpen,
  FaClipboardList,
  FaStar
} from 'react-icons/fa';
import logo from '../../../assets/logo.png';

const StudentSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard/student', icon: FaHome, label: 'Dashboard', end: true },
    { path: '/dashboard/student/enrolled-courses', icon: FaBookOpen, label: 'Enrolled Courses' },
    { path: '/dashboard/student/schedule', icon: FaCalendarAlt, label: 'Schedule' },
    { path: '/dashboard/student/materials', icon: FaFolderOpen, label: 'Materials' },
    { path: '/dashboard/student/appointments', icon: FaCalendarAlt, label: 'Appointments' },
    { path: '/dashboard/student/exams', icon: FaClipboardList, label: 'Exams' },
    { path: '/dashboard/student/grades', icon: FaGraduationCap, label: 'Grades' },
    { path: '/dashboard/student/evaluations', icon: FaStar, label: 'Evaluations' },
    { path: '/dashboard/student/books', icon: FaBook, label: 'My Books' },
    { path: '/dashboard/student/profile', icon: FaUserCircle, label: 'Profile' },
    { path: '/dashboard/student/settings', icon: FaCog, label: 'Settings' }
  ];

  return (
    <div className="w-64 bg-purple-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-purple-800">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Shikkha" className="w-8 h-8 rounded object-cover" />
          <span className="text-xl font-bold">Student Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-700 text-white'
                      : 'text-purple-200 hover:bg-purple-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-purple-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-purple-200 hover:bg-purple-800 hover:text-white rounded-lg transition-colors"
        >
          <FaSignOutAlt className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default StudentSidebar;

