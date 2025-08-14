import React from 'react';
import footer_logo from '../Assets/logo.png';
import instagram_icon from '../Assets/instagram_icon.png';
import pintester_icon from '../Assets/pintester_icon.png';
import whatsapp_icon from '../Assets/whatsapp_icon.png';

const Footer = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-5 px-2 bg-gray-100">
      <div className="flex items-center gap-4">
        <img src={footer_logo} alt="Logo" className="h-16" />
        <p className="text-3xl font-bold text-gray-800">Shikkha.com</p>
      </div>

      <ul className="flex gap-10 text-lg text-gray-800 list-none p-0 m-0">
        {['Company', 'Products', 'Offices', 'About', 'Contact'].map((item, idx) => (
          <li
            key={idx}
            className="relative cursor-pointer hover:text-green-600 transition-colors duration-300"
          >
            {item}
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-green-500 transition-all duration-300 hover:w-full"></span>
          </li>
        ))}
      </ul>

      <div className="flex gap-5">
        {[instagram_icon, pintester_icon, whatsapp_icon].map((icon, idx) => (
          <div
            key={idx}
            className="h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors duration-300"
          >
            <img src={icon} alt="Social Icon" className="h-7 w-7 object-contain" />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-5 w-full text-gray-800 text-sm">
        <hr className="w-full border-t border-gray-300 m-0" />
        <p>Ishmam © 2025 All Rights Reserved</p>
      </div>
    </div>
  );
};

export default Footer;
