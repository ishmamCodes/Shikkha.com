import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiBook, FiAward, FiSettings } from 'react-icons/fi';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user?.role) {
      switch (user.role) {
        case 'admin':
          navigate('/');
          break;
        case 'educator':
          navigate('/');
          break;
        case 'student':
          navigate('/');
          break;
        default:
          navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 p-8 text-white">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 - 50,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              opacity: [0, 0.3, 0],
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              transition: {
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'reverse'
              }
            }}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div className="flex items-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                  <FiUser className="text-white text-3xl" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-400 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold">Welcome Back</h3>
                <p className="text-white/80">Ready to learn today?</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-white/70">Courses</div>
              </div>
              <div>
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm text-white/70">Lessons</div>
              </div>
              <div>
                <div className="text-2xl font-bold">98%</div>
                <div className="text-sm text-white/70">Progress</div>
              </div>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl md:col-span-2"
          >
            <h3 className="text-xl font-bold mb-6">Learning Dashboard</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <FiBook className="text-2xl" />, value: '5', label: 'New Courses' },
                { icon: <FiAward className="text-2xl" />, value: '3', label: 'Certificates' },
                { icon: <FiUser className="text-2xl" />, label: 'Mentors', value: '8' },
                { icon: <FiSettings className="text-2xl" />, label: 'Settings', value: '' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/5 rounded-xl p-4 text-center cursor-pointer hover:bg-white/10 transition-all"
                >
                  <div className="text-blue-300 mb-2 flex justify-center">{item.icon}</div>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-sm text-white/70">{item.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-3 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl"
          >
            <div className="flex flex-col items-center justify-center py-16">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
                className="text-8xl mb-8 text-blue-300"
              >
                🚀
              </motion.div>
              <h2 className="text-3xl font-bold mb-4 text-center">Dashboard Coming Soon!</h2>
              <p className="text-white/80 text-center max-w-md mb-8">
                We're working hard to bring you an amazing learning experience. Stay tuned for exciting updates!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium shadow-lg"
              >
                Explore Courses
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Animated Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-white/50 text-sm"
        >
          <p>© Shikkha.com by Ishmam. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;