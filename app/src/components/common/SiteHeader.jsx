import { useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ModeToggle";

import { sidebarData } from "@/data/sidebarData";

const getPageTitle = (pathname, data) => {
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
  const pageTitle = getPageTitle(location.pathname, sidebarData);

  return (
    <header>
      <div className="flex w-full items-center">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" />
        <h1 className="text-base font-medium">
          {pageTitle}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};
