import * as React from "react"

import { sidebarData } from "@/components/dashboard/sidebarData.js"
import { NavDocuments } from "@/components/dashboard/nav-documents"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "@/components/dashboard/nav-user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="flex items-center gap-2">
                <Avatar className="rounded-lg">
                  <AvatarImage src="/POSSUM Icon.png" />
                  <AvatarFallback>P</AvatarFallback>
                </Avatar>
                <h1>POSSUM</h1>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <NavMain items={sidebarData.navMain} />

        <Separator />

        <NavDocuments projects={sidebarData.documents} />
      </SidebarContent>

      <Separator />

      <SidebarFooter>
        <NavSecondary items={sidebarData.navSecondary} />

        <Separator />

        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
