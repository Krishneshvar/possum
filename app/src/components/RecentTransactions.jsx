import React from 'react';

const RecentTransactions = ({ transactions }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <a href="#" className="text-sm text-blue-400 hover:underline">View All</a>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-2 px-4 text-gray-400">Transaction ID</th>
              <th className="py-2 px-4 text-gray-400">Time</th>
              <th className="py-2 px-4 text-gray-400">Items</th>
              <th className="py-2 px-4 text-gray-400">Payment</th>
              <th className="py-2 px-4 text-gray-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr key={index} className="border-b border-gray-700 last:border-b-0">
                <td className="py-2 px-4 font-medium">{tx.id}</td>
                <td className="py-2 px-4">{tx.time}</td>
                <td className="py-2 px-4">{tx.items}</td>
                <td className={`py-2 px-4 text-sm font-semibold`}>
                  <span className={`px-2 py-1 rounded-full ${tx.payment === 'Card' ? 'bg-blue-900 text-blue-300' : tx.payment === 'Cash' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                    {tx.payment}
                  </span>
                </td>
                <td className="py-2 px-4">{tx.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTransactions;
