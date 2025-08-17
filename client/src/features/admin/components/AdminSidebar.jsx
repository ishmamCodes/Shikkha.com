import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaChartBar, 
  FaUsers, 
  FaUserGraduate,
  FaUserPlus,
  FaBlog,
  FaShoppingCart,
  FaBook,
  FaBoxes,
  FaSignOutAlt
} from 'react-icons/fa';
import logo from '../../../assets/logo.png';

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear admin-specific and shared auth to fully log out
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: FaChartBar, label: 'Website Analytics', end: true },
    { path: '/admin/dashboard/educators', icon: FaUsers, label: 'Manage Educators' },
    { path: '/admin/dashboard/students', icon: FaUserGraduate, label: 'Manage Students' },
    { path: '/admin/dashboard/add-instructor', icon: FaUserPlus, label: 'Add Instructor' },
    { path: '/admin/dashboard/blogs', icon: FaBlog, label: 'Manage Blogs' },
    { path: '/admin/dashboard/books', icon: FaBook, label: 'Manage Books' }
  ];

  return (
    <div className="w-64 bg-purple-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-purple-800">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Shikkha" className="w-8 h-8 rounded object-cover" />
          <span className="text-xl font-bold">Admin Portal</span>
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

export default AdminSidebar;
