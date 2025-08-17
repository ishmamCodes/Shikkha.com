import React, { useState, useEffect } from 'react';
import logo from '../assets/logo192.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiMessageSquare, FiBook, FiLogIn, FiLogOut, FiUser, FiGrid, FiVideo, FiShoppingCart, FiBookOpen, FiUsers } from 'react-icons/fi';
import { FiCpu } from 'react-icons/fi';
import { useUser } from '../context/UserContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useUser();
  const [menu, setMenu] = useState('Home');
  const [isHovering, setIsHovering] = useState(null);

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
    if (user.fullName && !looksLikeEmail(user.fullName)) return user.fullName;
    if (user.email) return toTitleFromEmail(user.email);
    return 'User';
  })();

  const baseMenuItems = [
    { label: 'Home', path: '/', icon: <FiHome /> },
    { label: 'Blog', path: '/blog', icon: <FiBook /> },
    { label: 'Messenger', path: '/messenger', icon: <FiMessageSquare /> },
    { label: 'Videos', path: '/videos', icon: <FiVideo /> },
  ];
  // Hide Messenger for admins
  const menuItems = user?.role === 'admin'
    ? baseMenuItems.filter(item => item.label !== 'Messenger')
    : baseMenuItems;

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setMenu('Home');
    } else if (path.startsWith('/admin/dashboard/add-instructor')) {
      setMenu('Add Instructor');
    } else if (path.startsWith('/admin/dashboard')) {
      setMenu('Dashboard');
    } else if (path.startsWith('/dashboard/')) {
      setMenu('Dashboard');
    } else if (path.startsWith('/instructors')) {
      setMenu('Instructors');
    } else if (path.startsWith('/courses')) {
      setMenu('Courses');
    } else if (path.startsWith('/library')) {
      setMenu('Library');
    } else if (path.startsWith('/cart')) {
      setMenu('Cart');
    } else if (path.startsWith('/videos/upload')) {
      setMenu('Upload Video');
    } else if (path.startsWith('/videos')) {
      setMenu('Videos');
    } else if (path.startsWith('/blog')) {
      setMenu('Blog');
    } else if (path.startsWith('/messenger')) {
      setMenu('Messenger');
    } else {
      const segment = path.split('/')[1];
      const capitalized = segment ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase() : 'Home';
      setMenu(capitalized);
    }
  }, [location]);

  const handleLogout = () => {
    updateUser(null);
    navigate('/');
    setMenu('Home');
    // Optional: force reload if components elsewhere don't react to context change properly.
    // window.location.reload(); 
  };

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-100"
    >
      <div className="max-w-full mx-auto px-8 py-3 flex justify-between items-center">
        {/* Logo + Title - Positioned more to the left */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-4 cursor-pointer flex-shrink-0"
          onClick={() => navigate('/')}
        >
          <motion.img 
            src={logo} 
            alt="Shikkha.com Logo" 
            className="h-14 w-auto"
            whileHover={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          />
          <motion.p 
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Shikkha.com
          </motion.p>
    </motion.div>

        {/* Menu Items - Expanded center section (only when logged in) */}
        {user && (
        <div className="hidden md:flex gap-1 items-center bg-white/80 rounded-full p-2 shadow-inner border border-gray-200 flex-grow justify-center max-w-6xl overflow-x-auto">
          {menuItems.map((item) => (
            <motion.div
              key={item.path}
              onHoverStart={() => setIsHovering(item.label)}
              onHoverEnd={() => setIsHovering(null)}
              className="relative"
            >
              <Link
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
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

          {/* Role-based navigation buttons */}
          {user?.role === "student" && (
            <>
              <motion.div
                onHoverStart={() => setIsHovering("Dashboard")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/dashboard/student"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Dashboard" 
                      ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md' 
                      : 'text-gray-600 hover:text-blue-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiGrid /></span>
                  Dashboard
                </Link>
              </motion.div>

              {/* Instructors link for students */}
              <motion.div
                onHoverStart={() => setIsHovering("Instructors")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/instructors"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Instructors" 
                      ? 'text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md' 
                      : 'text-gray-600 hover:text-indigo-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiUsers /></span>
                  Instructors
                </Link>
              </motion.div>

              <motion.div
                onHoverStart={() => setIsHovering("Courses")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/courses"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Courses" 
                      ? 'text-white bg-gradient-to-r from-green-500 to-teal-500 shadow-md' 
                      : 'text-gray-600 hover:text-green-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiBookOpen /></span>
                  Courses
                </Link>
              </motion.div>

              <motion.div
                onHoverStart={() => setIsHovering("Library")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/library"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Library" 
                      ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-md' 
                      : 'text-gray-600 hover:text-purple-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiBook /></span>
                  Library
                </Link>
              </motion.div>

              <motion.div
                onHoverStart={() => setIsHovering("Cart")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/cart"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Cart" 
                      ? 'text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-md' 
                      : 'text-gray-600 hover:text-orange-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiShoppingCart /></span>
                  Cart
                </Link>
              </motion.div>
            </>
          )}

          {/* Dashboard button for admin */}
          {user?.role === "admin" && (
            <>
              <motion.div
                onHoverStart={() => setIsHovering("Dashboard")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Dashboard" 
                      ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md' 
                      : 'text-gray-600 hover:text-blue-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiGrid /></span>
                  Dashboard
                </Link>
              </motion.div>

              {/* Admin: Instructors */}
              <motion.div
                onHoverStart={() => setIsHovering("Instructors")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/instructors"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Instructors" 
                      ? 'text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md' 
                      : 'text-gray-600 hover:text-indigo-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiUsers /></span>
                  Instructors
                </Link>
              </motion.div>

              {/* Admin: Courses */}
              <motion.div
                onHoverStart={() => setIsHovering("Courses")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/courses"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Courses" 
                      ? 'text-white bg-gradient-to-r from-green-500 to-teal-500 shadow-md' 
                      : 'text-gray-600 hover:text-green-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiBookOpen /></span>
                  Courses
                </Link>
              </motion.div>

              {/* Admin: Library */}
              <motion.div
                onHoverStart={() => setIsHovering("Library")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/library"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Library" 
                      ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-md' 
                      : 'text-gray-600 hover:text-purple-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiBook /></span>
                  Library
                </Link>
              </motion.div>
            </>
          )}

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
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Dashboard" 
                      ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md' 
                      : 'text-gray-600 hover:text-blue-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiGrid /></span>
                  Dashboard
                </Link>
              </motion.div>

              {/* Instructors link for educators */}
              <motion.div
                onHoverStart={() => setIsHovering("Instructors")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/instructors"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Instructors" 
                      ? 'text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md' 
                      : 'text-gray-600 hover:text-indigo-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiUsers /></span>
                  Instructors
                </Link>
              </motion.div>

              {/* Courses link for educators */}
              <motion.div
                onHoverStart={() => setIsHovering("Courses")}
                onHoverEnd={() => setIsHovering(null)}
                className="relative"
              >
                <Link
                  to="/courses"
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Courses" 
                      ? 'text-white bg-gradient-to-r from-green-500 to-teal-500 shadow-md' 
                      : 'text-gray-600 hover:text-green-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiBookOpen /></span>
                  Courses
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
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    menu === "Upload Video" 
                      ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-md' 
                      : 'text-gray-600 hover:text-purple-600'
                  } transition-all duration-300`}
                >
                  <span className="mr-2"><FiVideo /></span>
                  Upload Video
                </Link>
              </motion.div>
            </>
          )}
        </div>

        )}

        {/* Auth Buttons - Positioned more to the right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex-shrink-0"
        >
          {user ? (
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden md:flex items-center gap-3 cursor-pointer bg-white/90 rounded-full px-4 py-2 shadow-sm border border-gray-200"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-blue-600 text-lg" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">{displayName}</span>
                  <span className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</span>
                </div>
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

      {/* Mobile Menu (only when logged in) */}
      {user && (
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
              <span className="text-sm mt-1">{item.label}</span>
            </Link>
          ))}

          {/* Mobile navigation for students */}
          {user?.role === "student" && (
            <>
              <Link
                to="/dashboard/student"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Dashboard" ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiGrid /></span>
                <span className="text-sm mt-1">Dashboard</span>
              </Link>

              <Link
                to="/instructors"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Instructors" ? 'text-indigo-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiUsers /></span>
                <span className="text-sm mt-1">Instructors</span>
              </Link>

              <Link
                to="/courses"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Courses" ? 'text-green-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiBookOpen /></span>
                <span className="text-sm mt-1">Courses</span>
              </Link>

              <Link
                to="/library"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Library" ? 'text-purple-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiBook /></span>
                <span className="text-sm mt-1">Library</span>
              </Link>

              <Link
                to="/cart"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Cart" ? 'text-orange-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiShoppingCart /></span>
                <span className="text-sm mt-1">Cart</span>
              </Link>
            </>
          )}

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
                <span className="text-sm mt-1">Dashboard</span>
              </Link>

              <Link
                to="/instructors"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Instructors" ? 'text-indigo-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiUsers /></span>
                <span className="text-sm mt-1">Instructors</span>
              </Link>

              <Link
                to="/courses"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Courses" ? 'text-green-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiBookOpen /></span>
                <span className="text-sm mt-1">Courses</span>
              </Link>

              <Link
                to="/videos/upload"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Upload Video" ? 'text-purple-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiVideo /></span>
                <span className="text-sm mt-1">Upload</span>
              </Link>
            </>
          )}

          {/* Mobile navigation for admin */}
          {user?.role === "admin" && (
            <>
              <Link
                to="/admin/dashboard"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Dashboard" ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiGrid /></span>
                <span className="text-sm mt-1">Dashboard</span>
              </Link>

              <Link
                to="/instructors"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Instructors" ? 'text-indigo-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiUsers /></span>
                <span className="text-sm mt-1">Instructors</span>
              </Link>

              <Link
                to="/courses"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Courses" ? 'text-green-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiBookOpen /></span>
                <span className="text-sm mt-1">Courses</span>
              </Link>

              <Link
                to="/library"
                className={`text-sm font-medium flex flex-col items-center ${
                  menu === "Library" ? 'text-purple-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg"><FiBook /></span>
                <span className="text-sm mt-1">Library</span>
              </Link>

            </>
          )}
        </div>
      </div>
      )}
    </motion.div>
  );
};

export default Navbar;
