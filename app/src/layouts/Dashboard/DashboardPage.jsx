import {
  HashRouter,
  Route,
  Routes,
} from 'react-router-dom';

import { AppSidebar } from "@/layouts/Sidebar/app-sidebar";
import { StatCards } from "@/components/common/stat-cards";
import { SiteHeader } from '@/components/common/site-header';
import {
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Separator } from '@/components/ui/separator';

import { cardData } from './dashboardStatsData';

import HelpPage from '../../features/Misc/HelpPage';
import PluginsPage from '../../features/Misc/PluginsPage';
import ProductDetailsPage from '../../features/Products/pages/ProductDetailsPage';
import ProductsPage from '../../features/Products/pages/ProductsPage';
import AddOrEditProductPage from '../../features/Products/pages/AddOrEditProductPage';
import OrdersPage from '../../features/Orders/pages/OrdersPage';
import CategoriesPage from '../../features/Categories/pages/CategoriesPage';
import InventoryPage from '../../features/Inventory/pages/InventoryPage';
import VariantsPage from '../../features/Variants/pages/VariantsPage';
import SalesHistoryPage from '../../features/Sales/pages/SalesHistoryPage';
import SalesPage from '../../features/Sales/pages/SalesPage';
import SettingsPage from '../../features/Settings/pages/SettingsPage';
import TransactionsPage from '../../features/Transactions/pages/TransactionsPage';
import PurchasePage from '../../features/Purchase/pages/PurchasePage';
import PurchaseOrdersPage from '@/features/Purchase/pages/PurchaseOrderPage';
import SuppliersPage from '@/features/Suppliers/pages/SuppliersPage';
import PeoplePage from '@/features/People/pages/PeoplePage';
import CustomersPage from '@/features/People/pages/CustomersPage';
import EmployeesPage from '@/features/People/pages/EmployeesPage';

export default function DashboardPage() {
  return (
    <HashRouter>
      <SidebarProvider
        className="bg-slate-100"
        style={{
          "--sidebar-width": "min(280px, calc(100vw - 32px))",
          // "--header-height": "auto",
        }}
      >
        <AppSidebar variant="floating" />
        <div className="w-full bg-slate-100 p-1 sm:p-2 lg:p-4 min-h-screen">
          <div className="w-full max-w-full overflow-hidden">
            <SiteHeader />
            <Separator className="my-2 sm:my-4" />
            <div className="flex flex-1 flex-col py-2 px-1 sm:py-4 sm:px-2 lg:py-6 lg:px-4 space-y-4 sm:space-y-6">
              <Routes>
                <Route path="/" element={<StatCards cardData={cardData} />} />
                <Route path="/dashboard" element={<StatCards cardData={cardData} />} />

                <Route path="/sales" element={<SalesPage />} />
                <Route path="/sales/orders" element={<OrdersPage />} />
                <Route path="/sales/history" element={<SalesHistoryPage />} />
                <Route path="/sales/transactions" element={<TransactionsPage />} />

                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/add" element={<AddOrEditProductPage />} />
                <Route path="/products/edit/:productId" element={<AddOrEditProductPage />} />
                <Route path="/products/:productId" element={<ProductDetailsPage />} />
                <Route path="/products/inventory" element={<InventoryPage />} />
                <Route path="/products/variants" element={<VariantsPage />} />
                <Route path="/products/categories" element={<CategoriesPage />} />

                <Route path="/purchase" element={<PurchasePage />} />
                <Route path="/purchase/orders" element={<PurchaseOrdersPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />

                <Route path="/people" element={<PeoplePage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/employees" element={<EmployeesPage />} />

                <Route path="/plugins" element={<PluginsPage />} />

                <Route path="/help" element={<HelpPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </HashRouter>
  );
};
