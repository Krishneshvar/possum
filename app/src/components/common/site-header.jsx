import { useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { sidebarData } from "@/data/sidebarData";

const getPageTitle = (pathname, data) => {
  const allNavItems = [...data.navMain, ...data.navSecondary];

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
      <div className="flex w-full items-center gap-1 px-4 py-2 sm:py-0 md:py-1 lg:py-0">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">
          {pageTitle}
        </h1>
      </div>
    </header>
  );
};
