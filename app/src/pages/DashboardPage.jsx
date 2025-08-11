import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import RecentTransactions from '../components/RecentTransactions';
import QuickActions from '../components/QuickActions';
import TodaySummary from '../components/TodaySummary';

// Dummy data to use until the API is ready
const dummyData = {
  stats: {
    totalSales: {
      title: 'Total Sales Today',
      value: '$2,847.50',
      change: '+12.5%',
      changeType: 'positive'
    },
    itemsSold: {
      title: 'Items Sold',
      value: '142',
      change: '+8.2%',
      changeType: 'positive'
    },
    customersServed: {
      title: 'Customers Served',
      value: '67',
      change: '-3.1%',
      changeType: 'negative'
    },
    averageSale: {
      title: 'Average Sale',
      value: '$42.50',
      change: '+5.7%',
      changeType: 'positive'
    },
  },
  recentTransactions: [
    { id: '#1247', time: '2:34 PM', items: '3 items', payment: 'Card', total: '$45.50' },
    { id: '#1246', time: '2:28 PM', items: '1 items', payment: 'Cash', total: '$12.99' },
    { id: '#1245', time: '2:15 PM', items: '5 items', payment: 'Digital', total: '$78.25' },
    { id: '#1244', time: '1:52 PM', items: '2 items', payment: 'Card', total: '$34.00' },
    { id: '#1243', time: '1:43 PM', items: '4 items', payment: 'Card', total: '$56.80' },
    { id: '#1242', time: '1:31 PM', items: '1 items', payment: 'Cash', total: '$8.50' },
  ],
  summary: {
    revenue: '$2,847.50',
    transactions: '67',
    items: '142',
    netProfit: '$1,698.20',
  },
};

export default function DashboardPage() {
  // Use the dummy data directly for now
  const dashboardData = dummyData;

  // The loading state and useEffect hook are no longer needed
  // as the data is hardcoded
  const { stats, recentTransactions, summary } = dashboardData;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-6">
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-400 mb-6">Overview of your business performance and recent activity.</p>
          
          {/* Stats Cards Section - Uncommented to display dummy data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard {...stats.totalSales} />
            <StatsCard {...stats.itemsSold} />
            <StatsCard {...stats.customersServed} />
            <StatsCard {...stats.averageSale} />
          </div>

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <RecentTransactions transactions={recentTransactions} />
            </div>
            <div className="lg:w-1/3 flex flex-col gap-6">
              <QuickActions />
              <TodaySummary summary={summary} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
