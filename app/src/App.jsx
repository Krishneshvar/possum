import { useEffect, useState } from 'react';

export default function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    window.electronAPI.ping().then(setMessage);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-lg">POSSUM Running</h1>
      <p className="mt-4">IPC Test: {message}</p>
    </div>
  );
}
