import { useLocation } from "react-router-dom"; // Import useLocation to get the current URL
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { sidebarData } from "./sidebarData.js"; // Import your data

// Helper function to find the title based on the URL
const getPageTitle = (pathname, data) => {
  // Combine all navigation items into a single array for easier searching
  const allNavItems = [...data.navMain, ...data.navSecondary];

  // Search for the title in the main navigation items
  for (const item of allNavItems) {
    // Check if the current URL matches a top-level item
    if (item.url === pathname) {
      return item.title;
    }
    // Check if the current URL matches a sub-item
    if (item.items) {
      for (const subItem of item.items) {
        if (subItem.url === pathname) {
          return subItem.title;
        }
      }
    }
  }

  // Fallback to a default title if no match is found
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
        {/* The h1 now displays the dynamic pageTitle */}
        <h1 className="text-base font-medium">{pageTitle}</h1>
      </div>
    </header>
  );
}
