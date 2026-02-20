import { useLocation, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@/features/Auth/authSlice";
import { useLogoutMutation } from "@/services/authApi";

import { sidebarData } from "@/data/sidebarData";

const getPageTitle = (pathname: string, data: any) => {
  const allNavItems = [...data.navMain, ...data.navSecondary];

  if (pathname === "/" || pathname === "/dashboard") {
    return "Dashboard";
  }

  for (const item of allNavItems) {
    if (item.url === pathname) {
      return item.title;
    }
    if (item.items) {
      for (const subItem of item.items) {
        if (subItem.url === pathname) {
          return subItem.title;
        }
      }
    }
  }

  return "Dashboard";
};

export function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logoutMutation] = useLogoutMutation();
  const pageTitle = getPageTitle(location.pathname, sidebarData);

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      // Ignore error, logout locally anyway
    }
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header>
      <div className="flex w-full items-center">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" />
        <h1 className="text-base font-medium text-foreground">
          {pageTitle}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
