import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchGeneralSettings } from '@/features/Settings/settingsSlice';
import DashboardPage from "@/layouts/Dashboard/DashboardPage";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchGeneralSettings());
  }, [dispatch]);

  return (
    <div>
      <DashboardPage />
      <Toaster richColors expand={true} closeButton />
    </div>
  );
};
