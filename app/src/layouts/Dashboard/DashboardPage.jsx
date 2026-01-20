import React from 'react';
import {
  HashRouter,
  Route,
  Routes,
  Outlet
} from 'react-router-dom';

import { AppSidebar } from "@/layouts/Sidebar/AppSidebar";
import { StatCards } from "@/components/common/StatCards";
import { SiteHeader } from '@/components/common/SiteHeader';
import { SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from '@/components/ui/separator';

import { cardData } from './dashboardStatsData';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMeQuery } from '@/services/authApi';
import { setUser, setLoading, selectIsAuthenticated, selectCurrentUser } from '@/features/Auth/authSlice';

import LoginPage from '@/features/Auth/pages/LoginPage';
import ProtectedRoute from '@/features/Auth/components/ProtectedRoute';
import HelpPage from '@/features/Misc/HelpPage';
import PluginsPage from '@/features/Misc/PluginsPage';
import ProductDetailsPage from '@/features/Products/pages/ProductDetailsPage';
import ProductsPage from '@/features/Products/pages/ProductsPage';
import AddOrEditProductPage from '@/features/Products/pages/AddOrEditProductPage';
import OrdersPage from '@/features/Orders/pages/OrdersPage';
import CategoriesPage from '@/features/Categories/pages/CategoriesPage';
import InventoryPage from '@/features/Inventory/pages/InventoryPage';
import VariantsPage from '@/features/Variants/pages/VariantsPage';
import SalesHistoryPage from '@/features/Sales/pages/SalesHistoryPage';
import SaleDetailsPage from '@/features/Sales/pages/SaleDetailsPage';
import SalesPage from '@/features/Sales/pages/SalesPage';
import SettingsPage from '@/features/Settings/pages/SettingsPage';
import TransactionsPage from '@/features/Transactions/pages/TransactionsPage';
import PurchasePage from '@/features/Purchase/pages/PurchasePage';
import PurchaseOrdersPage from '@/features/Purchase/pages/PurchaseOrderPage';
import CreatePurchaseOrderPage from '@/features/Purchase/pages/CreatePurchaseOrderPage';
import SuppliersPage from '@/features/Suppliers/pages/SuppliersPage';
import PeoplePage from '@/features/People/pages/PeoplePage';
import CustomersPage from '@/features/People/pages/CustomersPage';
import EmployeesPage from '@/features/People/pages/EmployeesPage';
import PurchaseOrderDetailPage from '@/features/Purchase/pages/PurchaseOrderDetailPage';


const MainLayout = () => {
  return (
    <SidebarProvider
      className="bg-muted"
      style={{ "--sidebar-width": "250px" }}
    >
      <AppSidebar variant="floating" />
      <main className="w-full bg-background p-4 min-h-screen">
        <SiteHeader />
        <Separator className="my-4" />
        <div className="flex flex-col">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const token = sessionStorage.getItem('possum_token');
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  // Try to load user if token exists but not authenticated in state
  const { data: user, isLoading, isError } = useGetMeQuery(undefined, {
    skip: !token || (isAuthenticated && !!currentUser)
  });

  React.useEffect(() => {
    if (user) {
      dispatch(setUser(user));
    } else if (isError) {
      dispatch(setUser(null));
      sessionStorage.removeItem('possum_token');
    }

    if (!isLoading) {
      dispatch(setLoading(false));
    }
  }, [user, isError, isLoading, dispatch]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<StatCards cardData={cardData} />} />
          <Route path="/dashboard" element={<StatCards cardData={cardData} />} />

          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/orders" element={<OrdersPage />} />
          <Route path="/sales/history" element={<SalesHistoryPage />} />
          <Route path="/sales/history/:saleId" element={<SaleDetailsPage />} />
          <Route path="/sales/transactions" element={<TransactionsPage />} />

          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/add" element={<ProtectedRoute requiredPermissions="products.manage"><AddOrEditProductPage /></ProtectedRoute>} />
          <Route path="/products/edit/:productId" element={<ProtectedRoute requiredPermissions="products.manage"><AddOrEditProductPage /></ProtectedRoute>} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />

          <Route path="/inventory" element={<ProtectedRoute requiredPermissions="inventory.view"><InventoryPage /></ProtectedRoute>} />
          <Route path="/variants" element={<ProtectedRoute requiredPermissions="products.manage"><VariantsPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute requiredPermissions="products.manage"><CategoriesPage /></ProtectedRoute>} />

          <Route path="/products/inventory" element={<ProtectedRoute requiredPermissions="inventory.view"><InventoryPage /></ProtectedRoute>} />
          <Route path="/products/variants" element={<ProtectedRoute requiredPermissions="products.manage"><VariantsPage /></ProtectedRoute>} />
          <Route path="/products/categories" element={<ProtectedRoute requiredPermissions="products.manage"><CategoriesPage /></ProtectedRoute>} />

          <Route path="/purchase" element={<ProtectedRoute requiredPermissions="purchase.manage"><PurchasePage /></ProtectedRoute>} />
          <Route path="/purchase/orders" element={<ProtectedRoute requiredPermissions="purchase.manage"><PurchaseOrdersPage /></ProtectedRoute>} />
          <Route path="/purchase/orders/:id" element={<ProtectedRoute requiredPermissions="purchase.manage"><PurchaseOrderDetailPage /></ProtectedRoute>} />
          <Route path="/purchase/orders/create" element={<ProtectedRoute requiredPermissions="purchase.manage"><CreatePurchaseOrderPage /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute requiredPermissions="suppliers.manage"><SuppliersPage /></ProtectedRoute>} />

          <Route path="/people" element={<ProtectedRoute requiredPermissions="users.view"><PeoplePage /></ProtectedRoute>} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/employees" element={<ProtectedRoute requiredPermissions="users.manage"><EmployeesPage /></ProtectedRoute>} />

          <Route path="/plugins" element={<ProtectedRoute requiredPermissions="admin"><PluginsPage /></ProtectedRoute>} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
