import React from 'react';

const TodaySummary = ({ summary }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Today's Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Revenue</span>
          <span className="font-semibold">{summary.revenue}</span>
        </div>
        <div className="flex justify-between">
          <span>Transactions</span>
          <span className="font-semibold">{summary.transactions}</span>
        </div>
        <div className="flex justify-between">
          <span>Items</span>
          <span className="font-semibold">{summary.items}</span>
        </div>
        <div className="flex justify-between">
          <span>Net Profit</span>
          <span className="font-semibold text-green-500">{summary.netProfit}</span>
        </div>
      </div>
    </div>
  );
};

export default TodaySummary;
