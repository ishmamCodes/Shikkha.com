import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import footer_logo from '../Assets/logo.png';
import instagram_icon from '../Assets/instagram_icon.png';
import pintester_icon from '../Assets/pintester_icon.png';
import whatsapp_icon from '../Assets/whatsapp_icon.png';

const Footer = () => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  const socialIcons = [
    { icon: instagram_icon, name: 'Instagram', color: 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500' },
    { icon: pintester_icon, name: 'Pinterest', color: 'bg-gradient-to-br from-red-500 to-red-700' },
    { icon: whatsapp_icon, name: 'WhatsApp', color: 'bg-gradient-to-br from-green-500 to-green-700' }
  ];

  const footerLinks = [
    { name: 'Company', subItems: ['About Us', 'Careers', 'Blog'] },
    { name: 'Products', subItems: ['Courses', 'Tutorials', 'Certifications'] },
    { name: 'Offices', subItems: ['New York', 'London', 'Tokyo', 'Sydney'] },
    { name: 'About', subItems: ['Team', 'Mission', 'Values'] },
    { name: 'Contact', subItems: ['Support', 'Sales', 'Feedback'] }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.footer 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white pt-16 pb-8 px-4 md:px-8"
        >
          {/* Floating particles background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 100,
                  y: Math.random() * 100,
                  opacity: 0.2
                }}
                animate={{
                  y: [0, Math.random() * 50 - 25],
                  x: [0, Math.random() * 50 - 25],
                  transition: {
                    duration: 10 + Math.random() * 20,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear"
                  }
                }}
                className="absolute rounded-full bg-white/10"
                style={{
                  width: `${1 + Math.random() * 3}px`,
                  height: `${1 + Math.random() * 3}px`,
                }}
              />
            ))}
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Logo and tagline */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex flex-col items-center mb-12"
            >
              <div className="flex items-center gap-4 mb-4">
                <motion.img 
                  src={footer_logo} 
                  alt="Logo" 
                  className="h-16"
                  whileHover={{ rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                <motion.h2 
                  className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Shikkha.com
                </motion.h2>
              </div>
              <motion.p 
                className="text-lg text-gray-300 max-w-2xl text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Transforming education through innovative learning solutions that empower individuals and organizations worldwide.
              </motion.p>
            </motion.div>

            {/* Main footer content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Newsletter */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">Stay Updated</h3>
                <p className="text-gray-300 mb-4">Subscribe to our newsletter for the latest courses and updates.</p>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Your email" 
                    className="flex-1 px-4 py-3 rounded-l-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-r-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium"
                  >
                    Join
                  </motion.button>
                </div>
              </motion.div>

              {/* Links with hover effects */}
              {footerLinks.map((section, index) => (
                <motion.div
                  key={section.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <h3 className="text-xl font-semibold mb-4 text-cyan-400">{section.name}</h3>
                  <ul className="space-y-3">
                    {section.subItems.map((item, i) => (
                      <motion.li 
                        key={i}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <a 
                          href="#" 
                          className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center"
                          onMouseEnter={() => setHoveredItem(`${section.name}-${i}`)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <motion.span
                            animate={{
                              opacity: hoveredItem === `${section.name}-${i}` ? 1 : 0,
                              width: hoveredItem === `${section.name}-${i}` ? '12px' : '0px',
                            }}
                            className="inline-block h-1 rounded-full bg-cyan-400 mr-2"
                          />
                          {item}
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Social and copyright */}
            <div className="border-t border-gray-700 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                {/* Social icons with floating animation */}
                <motion.div className="flex gap-6">
                  {socialIcons.map((social, index) => (
                    <motion.a
                      key={social.name}
                      href="#"
                      className={`relative h-12 w-12 rounded-full ${social.color} flex items-center justify-center shadow-lg overflow-hidden`}
                      whileHover={{ y: -5 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
                    >
                      <img src={social.icon} alt={social.name} className="h-6 w-6 object-contain z-10" />
                      <motion.div 
                        className="absolute inset-0 bg-white/10"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 0.3 }}
                      />
                    </motion.a>
                  ))}
                </motion.div>

                {/* Copyright with animated year */}
                <motion.div 
                  className="text-gray-400 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  © {currentYear} Shikkha.com by Ishmam. All rights reserved.
                </motion.div>

                {/* Back to top button */}
                <motion.a
                  href="#top"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  whileHover={{ y: -2 }}
                >
                  <span>Back to top</span>
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </motion.svg>
                </motion.a>
              </div>
            </div>
          </div>

          {/* Floating CTA at bottom right */}
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            <motion.button
              className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-xl flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Contact Us
            </motion.button>
          </motion.div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
};

export default Footer;