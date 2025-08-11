import React from 'react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', icon: '🏠', href: '#dashboard', active: true },
    { name: 'POS / Sales', icon: '🛒', href: '#pos', active: false },
    { name: 'Products', icon: '📦', href: '#products', active: false },
    { name: 'Sales History', icon: '🧾', href: '#sales-history', active: false },
    { name: 'Payments', icon: '💳', href: '#payments', active: false },
    { name: 'Plugins', icon: '🔌', href: '#plugins', active: false },
  ];

  return (
    <nav className="flex flex-col w-64 h-full bg-gray-800 border-r border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-xl font-bold text-white">
          P
        </div>
        <h1 className="text-xl font-bold">POSsum</h1>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">NAVIGATION</h2>
        <ul className="space-y-2">
          {navItems.map((item, index) => (
            <li key={index}>
              <a
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition duration-200 ${
                  item.active 
                    ? 'bg-gray-700 text-blue-400 font-semibold' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
