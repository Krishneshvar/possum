import {
  HashRouter,
  Route,
  Routes,
} from 'react-router-dom';

import { AppSidebar } from "@/layouts/Sidebar/app-sidebar";
import { SectionCards } from "@/components/common/section-cards";
import { SiteHeader } from '@/components/common/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

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
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          }
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <Routes>
                  <Route path="/" element={<SectionCards />} />
                  <Route path="/dashboard" element={<SectionCards />} />

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
        </SidebarInset>
      </SidebarProvider>
    </HashRouter>
  );
};
