import DashboardPage from "@/layouts/Dashboard/DashboardPage";
import { Toaster } from "@/components/ui/sonner";

const appTheme = "light";

export default function App() {
  return (
    <div>
      <DashboardPage />
      <Toaster richColors expand={true} theme={appTheme} closeButton />
    </div>
  );
};
