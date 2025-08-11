import React from 'react';

export default function Header() {
  // Get and format the current date
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center">
        <h2 className="text-sm font-medium text-gray-400">{today}</h2>
      </div>
      <div className="flex items-center space-x-4">
        {/* Placeholder for Icons - replace with actual icon components */}
        <div className="p-2 rounded-full bg-gray-700 text-gray-400 cursor-pointer hover:bg-gray-600 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div className="p-2 rounded-full bg-gray-700 text-gray-400 cursor-pointer hover:bg-gray-600 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-.213-.77-.4-.84-.96-.067-.52.22-.924.58-.924h.08c.53 0 .76.6.6.96-.07.4-.2.83-.58 1.04-.4.21-.8.21-1.2 0-.4-.21-.78-.4-.84-.96-.067-.52.22-.924.58-.924h.08c.53 0 .76.6.6.96-.07.4-.2.83-.58 1.04-.4.21-.8.21-1.2 0-.4-.21-.78-.4-.84-.96-.067-.52.22-.924.58-.924h.08c.53 0 .76.6.6.96-.07.4-.2.83-.58 1.04-.4.21-.8.21-1.2 0zM10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="p-2 rounded-full bg-gray-700 text-gray-400 cursor-pointer hover:bg-gray-600 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </header>
  );
}
