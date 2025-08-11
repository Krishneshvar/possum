import React from 'react';

const QuickActions = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="space-y-4">
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
          Start New Sale
        </button>
        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
          Add Product
        </button>
        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
          View Reports
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
