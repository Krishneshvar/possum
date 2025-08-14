import {
  CircleQuestionMark,
  FileText,
  Frame,
  History,
  LayoutDashboard,
  Map,
  Package,
  PieChart,
  Puzzle,
  Settings,
  ShoppingCart,
  Split
} from "lucide-react"

export const sidebarData = {
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
      items: [
        {
          title: "History",
          url: "/sales/history",
          icon: History,
        },
      ]
    },
    {
      title: "Products",
      url: "/products",
      icon: Package,
      items: [
        {
          title: "Variants",
          url: "/variants",
          icon: Split,
        },
      ]
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
  documents: [
    {
      name: "Doc 1",
      url: "#",
    },
    {
      name: "Doc 2",
      url: "#",
    },
    {
      name: "Doc 3",
      url: "#",
    },
  ],
}
