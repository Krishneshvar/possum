import React from 'react';

const StatsCard = ({ title, value, change, changeType }) => {
  const changeColor = changeType === 'positive' ? 'text-green-500' : 'text-red-500';
  const icon = changeType === 'positive' ? '↑' : '↓'; // Replace with a real icon
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-gray-400 text-sm font-semibold mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <span className="text-4xl font-bold">{value}</span>
        <span className={`${changeColor} text-sm font-semibold`}>
          {icon} {change} vs yesterday
        </span>
      </div>
    </div>
  );
};

export default StatsCard;
