import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const linkClasses = ({ isActive }) =>
  `block px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-purple-700 text-white' : 'text-white hover:bg-purple-700/80'}`;

const EducatorSidebar = () => {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  return (
    <aside className="w-64 min-h-screen bg-purple-800 text-white p-4 sticky top-0 flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Educator</h2>
        <p className="text-white/70 text-sm">Dashboard</p>
      </div>
      <nav className="space-y-2 flex-1">
        <NavLink to="/dashboard/educator" end className={linkClasses}>Dashboard</NavLink>
        <NavLink to="/dashboard/educator/create-course" className={linkClasses}>Create Courses</NavLink>
        <NavLink to="/dashboard/educator/manage-courses" className={linkClasses}>My Courses</NavLink>
        <NavLink to="/dashboard/educator/manage-courses" className={linkClasses}>Student Enrollments</NavLink>
        <NavLink to="/dashboard/educator/upload-materials" className={linkClasses}>Upload Materials</NavLink>
        <NavLink to="/dashboard/educator/profile" className={linkClasses}>Profile</NavLink>
        <NavLink to="/dashboard/educator/settings" className={linkClasses}>Settings</NavLink>
      </nav>
      <button onClick={logout} className="mt-4 w-full px-4 py-3 rounded-md bg-purple-700 hover:bg-purple-600">Logout</button>
    </aside>
  );
};

export default EducatorSidebar;


