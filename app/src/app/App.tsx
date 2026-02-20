import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchGeneralSettings } from '@/features/Settings/settingsSlice';
import AppRoutes from "./AppRoutes";
import { Toaster } from "@/components/ui/sonner";
import { useAutoLogout } from '@/features/Auth/hooks/useAuth';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchGeneralSettings());
  }, [dispatch]);

  useAutoLogout();

  return (
    <div>
      <AppRoutes />
      <Toaster richColors expand={true} closeButton />
    </div>
  );
};
