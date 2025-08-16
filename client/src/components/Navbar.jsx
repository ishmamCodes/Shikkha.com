import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
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

  // Derive a clean display name
  const looksLikeEmail = (s) => typeof s === 'string' && s.includes('@');
  const toTitleFromEmail = (email) => {
    if (!email || !looksLikeEmail(email)) return '';
    const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    return base
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  const displayName = (() => {
    if (!user) return 'User';
    if (user.name && !looksLikeEmail(user.name)) return user.name;
    if (user.fullName && !looksLikeEmail(user.fullName)) return user.fullName;
    if (user.username && !looksLikeEmail(user.username)) return user.username;
    if (user.email) return toTitleFromEmail(user.email);
    if (user.username && looksLikeEmail(user.username)) return toTitleFromEmail(user.username);
    return 'User';
  })();

  const menuItems = [
    { label: 'Home', path: '/', icon: <FiHome /> },
    { label: 'Blog', path: '/blog', icon: <FiBook /> },
    { label: 'Instructors', path: '/instructors', icon: <FiUser /> },
    { label: 'Messenger', path: '/messenger', icon: <FiMessageSquare /> },
    { label: 'Videos', path: '/videos', icon: <FiVideo /> },
  ];

  useEffect(() => {
    const currentPath = location.pathname === '/' ? 'Home' : location.pathname.split('/')[1];
    const capitalized = currentPath.charAt(0).toUpperCase() + currentPath.slice(1).toLowerCase();
    setMenu(capitalized);
    // Refresh user from localStorage on route change
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      setUser(u || null);
    } catch {
      setUser(null);
    }
  }, [location]);

  // Keep user in sync across tabs and late updates
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        try {
          const u = JSON.parse(localStorage.getItem('user'));
          setUser(u || null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
      <div className="w-full px-4 py-3">
        {/* Single Row: Left (Logo + Name) | Center (Menu) | Right (User + Logout) */}
        <div className="w-full grid grid-cols-12 items-center">
          <div className="col-span-6 sm:col-span-4 flex items-center">
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
          </div>

          {/* Center Menu (desktop only) */}
          <div className="col-span-3 sm:col-span-4 hidden md:flex justify-center">
            <div className="flex gap-1 items-center bg-white/80 rounded-full p-1 shadow-inner border border-gray-200">
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
                  {isHovering === item.label && (
                    <motion.span
                      layoutId="underline"
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-[2px] w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded"
                    />
                  )}
                </motion.div>
              ))}
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
                  <motion.div
                    onHoverStart={() => setIsHovering("Courses")}
                    onHoverEnd={() => setIsHovering(null)}
                    className="relative"
                  >
                    <Link
                      to="/courses"
                      className={`flex items-center px-5 py-2 rounded-full text-sm font-medium ${
                        menu === "Courses" 
                          ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md' 
                          : 'text-gray-600 hover:text-blue-600'
                      } transition-all duration-300`}
                    >
                      <span className="mr-2"><FiBook /></span>
                      Courses
                    </Link>
                  </motion.div>
                  <motion.div
                    onHoverStart={() => setIsHovering("Upload Video")}
                    onHoverEnd={() => setIsHovering(null)}
                    className="relative"
                  >
                    <Link
                      to="/videos/upload"
                      className={`flex items-center px-5 py-2 rounded-full text-sm font-medium ${
                        menu === "Upload Video" 
                          ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md' 
                          : 'text-gray-600 hover:text-blue-600'
                      } transition-all duration-300`}
                    >
                      <span className="mr-2"><FiVideo /></span>
                      Upload Video
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Right: Auth Buttons */}
          <div className="col-span-6 sm:col-span-4 flex justify-end">
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
                    <span className="text-sm font-medium text-gray-700">{displayName}</span>
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
        </div>
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
                to="/courses"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Courses" ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiBook /></span>
                <span className="text-xs mt-1">Courses</span>
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
