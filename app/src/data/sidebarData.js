import {
  Activity,
  ArrowLeftRight,
  BarChart,
  Boxes,
  CircleQuestionMark,
  ClipboardCheck,
  ClipboardList,
  FileText,
  History,
  IdCardLanyard,
  Layers,
  LayoutDashboard,
  Package,
  Percent,
  Puzzle,
  Receipt,
  Settings,
  ShoppingCart,
  Split,
  Truck,
  User,
  Users,
  RotateCcw,
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
      title: "POS / Sales",
      url: "/sales",
      icon: ShoppingCart,
      items: [
        {
          title: "Orders",
          url: "/sales/orders",
          icon: Receipt,
        },
        {
          title: "History",
          url: "/sales/history",
          icon: History,
        },
        {
          title: "Transactions",
          url: "/sales/transactions",
          icon: ArrowLeftRight,
        },
        {
          title: "Returns",
          url: "/sales/returns",
          icon: RotateCcw,
        },
        {
          title: "Taxes",
          url: "/sales/taxes",
          icon: Percent,
        },
      ]
    },
    {
      title: "Products",
      url: "/products",
      icon: Package,
      items: [
        {
          title: "Inventory",
          url: "/inventory",
          icon: Boxes,
        },
        {
          title: "Variants",
          url: "/variants",
          icon: Split,
        },
        {
          title: "Product Flow",
          url: "/products/flow",
          icon: Activity,
        },
        {
          title: "Categories",
          url: "/categories",
          icon: Layers,
        },
      ]
    },
    {
      title: "Purchase",
      url: "/purchase",
      icon: Truck,
      items: [
        {
          title: "Purchase Orders",
          url: "/purchase/orders",
          icon: FileText,
        },
        {
          title: "Suppliers",
          url: "/suppliers",
          icon: Users,
        },
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
          icon: User,
        },
        {
          title: "Employees",
          url: "/employees",
          icon: IdCardLanyard,
        },
      ]
    },
    {
      title: "Reports & Logs",
      url: "/reports",
      icon: BarChart,
      items: [
        {
          title: "Sales Report",
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
