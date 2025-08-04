import React, { useState, useEffect } from 'react';
import logo from '../Assets/logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState('Home');

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
    { label: 'Messenger', path: '/messenger' },
  ];

  useEffect(() => {
    const currentPath = location.pathname === '/' ? 'Home' : location.pathname.split('/')[1];
    const capitalized = currentPath.charAt(0).toUpperCase() + currentPath.slice(1).toLowerCase();
    setMenu(capitalized);
  }, [location]);

const handleLogout = () => {
  localStorage.clear();
  setUser(null);
  navigate('/');
  setMenu('Home');
  window.location.reload(); // optional
};


  return (
    <div className="flex justify-between items-center px-4 py-3 bg-white shadow-md flex-wrap">
      {/* Logo + Title */}
      <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
        <img src={logo} alt="Shikkha.com Logo" className="h-12 w-auto" />
        <p>Shikkha.com</p>
      </div>

      {/* Menu Items */}
      <div className="flex gap-4 items-center">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-sm font-medium ${
              menu === item.label ? 'text-blue-600 font-bold' : 'text-gray-700'
            } hover:text-blue-600 transition`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Auth Buttons */}
      <div>
        {user ? (
          <button
            className="px-4 py-1 text-sm font-bold text-blue-600 border border-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : (
          <Link to="/login">
            <button className="px-4 py-1 text-sm font-bold text-blue-600 border border-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition">
              Login
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
