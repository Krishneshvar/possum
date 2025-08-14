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
    <header
      className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">
          {pageTitle}
        </h1>
      </div>
    </header>
  );
};
