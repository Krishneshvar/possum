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


import { NavMain } from "@/layouts/Sidebar/components/NavMain"
import { NavSecondary } from "@/layouts/Sidebar/components/NavSecondary"
import { NavUser } from "@/layouts/Sidebar/components/NavUser"
import { sidebarData } from "@/data/sidebarData.js"

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="rounded-t-lg">
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

      <Separator className="" />

      <SidebarContent className="">
        <NavMain items={sidebarData.navMain} />

        <Separator className="" />


      </SidebarContent>

      <Separator className="" />

      <SidebarFooter className="rounded-b-lg">
        <NavSecondary items={sidebarData.navSecondary} />

        <Separator className="" />

        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
