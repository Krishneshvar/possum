import { initDB } from '../db.js';

function getDashboardData() {
  const db = initDB();

  // Queries for stats cards
  const totalSalesQuery = db.prepare('SELECT SUM(total_amount) AS total FROM sales WHERE created_at >= date(\'now\', \'start of day\')').get();
  const itemsSoldQuery = db.prepare('SELECT SUM(quantity) AS total FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE created_at >= date(\'now\', \'start of day\'))').get();
  const customersServedQuery = db.prepare('SELECT COUNT(id) AS total FROM sales WHERE created_at >= date(\'now\', \'start of day\')').get();
  
  // Queries for recent transactions and summary
  const recentTransactionsQuery = db.prepare('SELECT id, total_amount, created_at FROM sales ORDER BY created_at DESC LIMIT 5').all();
  
  // Mock data for yesterday's values and profit calculation
  const yesterdaySales = 2700; 
  const yesterdayItems = 138;
  const yesterdayCustomers = 69;
  const netProfit = 1698.20; // This would be a more complex query in a real app

  const dashboardData = {
    stats: {
      totalSales: {
        title: 'Total Sales Today',
        value: `$${totalSalesQuery.total ? totalSalesQuery.total.toFixed(2) : '0.00'}`,
        change: `+${(((totalSalesQuery.total || 0) - yesterdaySales) / (yesterdaySales) * 100).toFixed(1)}%`,
        changeType: (totalSalesQuery.total || 0) > yesterdaySales ? 'positive' : 'negative',
      },
      itemsSold: {
        title: 'Items Sold',
        value: itemsSoldQuery.total || 0,
        change: `+${(((itemsSoldQuery.total || 0) - yesterdayItems) / (yesterdayItems) * 100).toFixed(1)}%`,
        changeType: (itemsSoldQuery.total || 0) > yesterdayItems ? 'positive' : 'negative',
      },
      customersServed: {
        title: 'Customers Served',
        value: customersServedQuery.total || 0,
        change: `${(((customersServedQuery.total || 0) - yesterdayCustomers) / (yesterdayCustomers) * 100).toFixed(1)}%`,
        changeType: (customersServedQuery.total || 0) > yesterdayCustomers ? 'positive' : 'negative',
      },
      averageSale: {
        title: 'Average Sale',
        value: `$${((totalSalesQuery.total || 0) / (customersServedQuery.total || 1)).toFixed(2)}`,
        change: '+5.7%', // Hardcoded for this example
        changeType: 'positive',
      },
    },
    recentTransactions: recentTransactionsQuery.map(tx => ({
        id: `#${tx.id}`,
        time: new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        items: '1 item', // Placeholder
        payment: 'Card', // Placeholder
        total: `$${tx.total_amount.toFixed(2)}`
    })),
    summary: {
      revenue: `$${totalSalesQuery.total ? totalSalesQuery.total.toFixed(2) : '0.00'}`,
      transactions: customersServedQuery.total || 0,
      items: itemsSoldQuery.total || 0,
      netProfit: `$${netProfit}`, // Hardcoded for this example
    },
  };
  
  return dashboardData;
}

export { getDashboardData };
