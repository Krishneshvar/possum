// app/src/data/sidebarData.ts
import {
  BarChart,
  Box,
  ClipboardCheck,
  LayoutDashboard,
  RefreshCw,
  ShoppingCart,
  Users,
  Settings,
  CircleQuestionMark,
  Puzzle,
  Truck,
  ArrowRightLeft
} from 'lucide-react';

export const sidebarData = {
  user: {
    name: "Admin User",
    email: "admin@possum.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Box,
      items: [
        {
          title: "Products",
          url: "/products",
        },
        {
          title: "Variants",
          url: "/variants",
        },
        {
          title: "Stock",
          url: "/inventory",
        },
        {
          title: "Categories",
          url: "/categories",
        },
      ],
    },
    {
      title: "Commercial",
      url: "#",
      icon: ShoppingCart,
      items: [
        {
          title: "Sales",
          url: "/sales",
        },
        {
          title: "Transactions",
          url: "/transactions",
        },
        {
          title: "Returns",
          url: "/returns",
        },
      ],
    },
    {
      title: "Purchase",
      url: "/purchase",
      icon: Truck,
      items: [
        {
          title: "Orders",
          url: "/purchase",
        },
        {
          title: "Suppliers",
          url: "/suppliers",
        }
      ]
    },
    {
      title: "People",
      url: "/people",
      icon: Users,
      items: [
        {
          title: "Customers",
          url: "/customers",
        },
        {
          title: "Employees",
          url: "/employees",
        },
      ],
    },
    {
      title: "Reports & Logs",
      url: "#",
      icon: BarChart,
      items: [
        {
          title: "Sales Reports",
          url: "/reports/sales",
          icon: BarChart,
        },
        {
          title: "Audit Log",
          url: "/audit-log",
          icon: ClipboardCheck,
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
}
