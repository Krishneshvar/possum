import {
  Ellipsis,
  FilePlus2,
  FileText,
  FolderInput,
  FolderPlus,
  Trash2,
  View,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavDocuments({
  projects
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-muted-foreground">
        <span>Documents</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center">
              <Ellipsis className="h-4 w-4" />
              <span className="sr-only">Add Document</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-48 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "end" : "start"}>
            <DropdownMenuItem>
              <FilePlus2 className="text-muted-foreground" />
              <span>Add Document</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FolderPlus className="text-muted-foreground" />
              <span>Add Folder</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <FileText />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <Ellipsis />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}>
                <DropdownMenuItem>
                  <View className="text-muted-foreground" />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FolderInput className="text-muted-foreground" />
                  <span>Move to</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500">
                  <Trash2 className="text-red-500" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
