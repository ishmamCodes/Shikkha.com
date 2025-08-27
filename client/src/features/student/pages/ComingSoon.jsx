import React from 'react';
import { FaCog } from 'react-icons/fa';

const ComingSoon = ({ title = "Coming Soon" }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <FaCog className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md">
        This feature is currently under development. We're working hard to bring you new functionality soon!
      </p>
    </div>
  );
};

export default ComingSoon;
