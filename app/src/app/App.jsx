import DashboardPage from "@/layouts/Dashboard/DashboardPage";
import { Toaster } from "@/components/ui/sonner";

const appTheme = "light";

const colors = {
  primary: 'bg-blue-600',
  primary_hover: 'bg-blue-700',
  bg_bg: 'bg-white',
  bg_surface: 'bg-slate-50',
  bg_gentle_separation: 'bg-slate-200',
  text_primary: 'bg-slate-900',
  text_secondary: 'bg-slate-500',
  bg_success: 'bg-emerald-600',
  bg_warning: 'bg-amber-600',
  bg_error: 'bg-red-600',
}

export default function App() {
  return (
    <div>
      <DashboardPage />
      <Toaster richColors expand={true} theme={appTheme} closeButton />
    </div>
  );
};
