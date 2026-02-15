import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '@/store/store';
import App from '@/app/App';
import './index.css';
import { ThemeProvider } from '@/components/ThemeProvider';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
} else {
  console.error('Root element not found');
}
