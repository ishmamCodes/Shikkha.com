import React, { useState, useEffect } from 'react';
import logo from '../Assets/logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiMessageSquare, FiBook, FiLogIn, FiLogOut, FiUser, FiGrid, FiVideo } from 'react-icons/fi';
import { FiCpu } from 'react-icons/fi'; 

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState('Home');
  const [isHovering, setIsHovering] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const menuItems = [
    { label: 'Home', path: '/', icon: <FiHome /> },
    { label: 'Blog', path: '/blog', icon: <FiBook /> },
    { label: 'Messenger', path: '/messenger', icon: <FiMessageSquare /> },
    { label: 'Videos', path: '/videos', icon: <FiVideo /> },
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
    window.location.reload();
  };

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo + Title */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <motion.img 
            src={logo} 
            alt="Shikkha.com Logo" 
            className="h-12 w-auto"
            whileHover={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          />
          <motion.p 
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Shikkha.com
          </motion.p>
        </motion.div>

        {/* Menu Items */}
        <div className="hidden md:flex gap-1 items-center bg-white/80 rounded-full p-1 shadow-inner border border-gray-200">
          {menuItems.map((item) => (
            <motion.div
              key={item.path}
              onHoverStart={() => setIsHovering(item.label)}
              onHoverEnd={() => setIsHovering(null)}
              className="relative"
            >
              <Link
                to={item.path}
                className={`flex items-center px-5 py-2 rounded-full text-sm font-medium ${
                  menu === item.label 
                    ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md' 
                    : 'text-gray-600 hover:text-blue-600'
                } transition-all duration-300`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
              
              <AnimatePresence>
                {isHovering === item.label && menu !== item.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2"
                  >
                    <div className="bg-white shadow-lg rounded-lg px-3 py-1 text-xs text-gray-600 whitespace-nowrap">
                      {item.label}
                      <div className="absolute w-3 h-3 bg-white transform rotate-45 -top-1 left-1/2 -translate-x-1/2 shadow-sm"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Dashboard button for educators only */}
          {user?.role === "educator" && (
            <>
              <motion.div
                onHoverStart={() => setIsHovering("Dashboard")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/dashboard/educator"
                  className={`flex items-center px-5 py-2 rounded-full text-sm font-medium ${
                    menu === "Dashboard" 
                      ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md' 
                      : 'text-gray-600 hover:text-blue-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiGrid /></span>
                  Dashboard
                </Link>
              </motion.div>

              {/* Upload Video link for educators */}
              <motion.div
                onHoverStart={() => setIsHovering("Upload Video")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/videos/upload"
                  className={`flex items-center px-5 py-2 rounded-full text-sm font-medium ${
                    menu === "Upload Video" 
                      ? 'text-white bg-gradient-to-r from-green-500 to-teal-500 shadow-md' 
                      : 'text-gray-600 hover:text-green-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiVideo /></span>
                  Upload Video
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Auth Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {user ? (
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden md:flex items-center gap-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                  <FiUser className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user.username || 'User'}
                </span>
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-md hover:shadow-lg transition-all"
              >
                <FiLogOut />
                <span>Logout</span>
              </motion.button>
            </div>
          ) : (
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-md hover:shadow-lg transition-all"
              >
                <FiLogIn />
                <span>Login</span>
              </motion.button>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden flex justify-center py-2 bg-gray-50">
        <div className="flex gap-6">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium flex flex-col items-center ${
                menu === item.label ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}

          {/* Mobile Dashboard + Upload Video for educators */}
          {user?.role === "educator" && (
            <>
              <Link
                to="/dashboard/educator"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Dashboard" ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiGrid /></span>
                <span className="text-xs mt-1">Dashboard</span>
              </Link>

              <Link
                to="/videos/upload"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Upload Video" ? 'text-green-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiVideo /></span>
                <span className="text-xs mt-1">Upload</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Navbar;
