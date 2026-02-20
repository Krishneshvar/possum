import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGeneralSettings } from '@/features/Settings/settingsSlice';
import DashboardPage from "@/layouts/Dashboard/DashboardPage";
import { Toaster } from "@/components/ui/sonner";
import { logout, selectIsAuthenticated } from '@/features/Auth/authSlice';
import { useLogoutMutation } from '@/services/authApi';
import { toast } from 'sonner';

// Frontend auto-logout matches backend session duration
const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes

export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [logoutMutation] = useLogoutMutation();

  useEffect(() => {
    dispatch(fetchGeneralSettings());
  }, [dispatch]);

  // Auto-logout Logic
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleLogout = async () => {
      try {
        // Call backend logout to invalidate session
        await logoutMutation().unwrap();
      } catch (error) {
        // Even if backend call fails, clear local state
        console.error('Logout API call failed:', error);
      } finally {
        dispatch(logout());
        toast.info('You have been logged out due to inactivity.');
      }
    };

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleLogout, AUTO_LOGOUT_TIME);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    // Initial start
    resetTimer();

    // Add listeners
    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [isAuthenticated, dispatch, logoutMutation]);

  return (
    <div>
      <DashboardPage />
      <Toaster richColors expand={true} closeButton />
    </div>
  );
};
