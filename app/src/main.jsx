import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import './index.css';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { ThemeProvider } from "@/components/ThemeProvider";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
