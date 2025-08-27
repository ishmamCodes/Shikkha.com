import React from 'react';

const ComingSoon = ({ title="Coming Soon" }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-xl w-full p-8 border rounded-2xl bg-white shadow-sm">
        <h1 className="text-2xl font-semibold text-purple-800 mb-2">{title}</h1>
        <p className="text-gray-600">This section is under development. Stay tuned!</p>
      </div>
    </div>
  );
};

export default ComingSoon;


