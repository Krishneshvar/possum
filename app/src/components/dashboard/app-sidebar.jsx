import {
  ChartColumn,
  CircleQuestionMark,
  History,
  LayoutDashboard,
  Package,
  Puzzle,
  Settings,
  ShoppingCart,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavSecondary } from "@/components/dashboard/nav-secondary"
import { NavUser } from "@/components/dashboard/nav-user"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin",
    username: "admin",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Sales",
      url: "/sales",
      icon: ShoppingCart,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: ChartColumn,
    },
    {
      title: "Products",
      url: "/products",
      icon: Package,
    },
    {
      title: "Sales History",
      url: "/sales-history",
      icon: History,
    },
    {
      title: "Plugins",
      url: "/plugins",
      icon: Puzzle,
    },
  ],
  navSecondary: [
    {
      title: "Get Help",
      url: "/help",
      icon: CircleQuestionMark,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex gap-2 items-center">
            <Avatar className="rounded-lg">
              <AvatarImage src="/POSSUM Icon.png" alt="POSSUM Icon" />
              <AvatarFallback>P</AvatarFallback>
            </Avatar>
            <span className="text-base font-semibold">POSSUM</span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
