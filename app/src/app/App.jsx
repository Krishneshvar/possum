import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGeneralSettings } from '@/features/Settings/settingsSlice';
import DashboardPage from "@/layouts/Dashboard/DashboardPage";
import { Toaster } from "@/components/ui/sonner";
import { logout, selectIsAuthenticated } from '@/features/Auth/authSlice';
import { toast } from 'sonner';

const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes

export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const timerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchGeneralSettings());
  }, [dispatch]);

  // Auto-logout Logic
  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dispatch(logout());
        toast.info('You have been logged out due to inactivity.');
      }, AUTO_LOGOUT_TIME);
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
  }, [isAuthenticated, dispatch]);

  return (
    <div>
      <DashboardPage />
      <Toaster richColors expand={true} closeButton />
    </div>
  );
};
