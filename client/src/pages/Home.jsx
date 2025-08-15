import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Added this import

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-700/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-indigo-700/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-8000"></div>
      </div>

      {/* Floating particles */}
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: `${Math.random() * 10 + 2}px`,
            height: `${Math.random() * 10 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 20 + 10}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        ></div>
      ))}

      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-white mb-6">
            Welcome Home!
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8">
            Your personalized learning journey starts here
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: '📚', 
              title: 'Explore Courses', 
              desc: 'Discover new knowledge and skills' 
            },
            { 
              icon: '🎓', 
              title: 'Track Progress', 
              desc: 'Monitor your learning achievements' 
            },
            { 
              icon: '🏆', 
              title: 'Earn Badges', 
              desc: 'Get recognized for your accomplishments' 
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-indigo-400/30 transition-all"
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-white/70">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add these styles to your CSS */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(50px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-30px, 30px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }
        .animate-blob {
          animation: blob 15s infinite ease-in-out;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-8000 {
          animation-delay: 8s;
        }
      `}</style>
    </div>
  );
};

export default Home;