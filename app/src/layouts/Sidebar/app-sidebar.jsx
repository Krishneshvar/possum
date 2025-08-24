import * as React from "react"

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

import { NavDocuments } from "@/components/common/nav-documents"
import { NavMain } from "@/components/common/nav-main"
import { NavSecondary } from "@/components/common/nav-secondary"
import { NavUser } from "@/components/common/nav-user"
import { sidebarData } from "@/data/sidebarData.js"

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="bg-slate-200 rounded-t-lg">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-transparent"
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

      <Separator className="bg-slate-50" />

      <SidebarContent className="bg-slate-200">
        <NavMain items={sidebarData.navMain} />

        <Separator className="bg-slate-50" />

        <NavDocuments projects={sidebarData.documents} />
      </SidebarContent>

      <Separator className="bg-slate-50" />

      <SidebarFooter  className="bg-slate-200 rounded-b-lg">
        <NavSecondary items={sidebarData.navSecondary} />

        <Separator className="bg-slate-50" />

        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
