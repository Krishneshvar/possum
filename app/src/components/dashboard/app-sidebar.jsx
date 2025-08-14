import * as React from "react"

import { sidebarData } from "@/components/dashboard/sidebarData.js"
import { NavDocuments } from "@/components/dashboard/nav-documents"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "@/components/dashboard/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        POSSUM
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavDocuments projects={sidebarData.documents} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={sidebarData.navSecondary} />
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
