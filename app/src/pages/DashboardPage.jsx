import {
  HashRouter,
  Route,
  Routes,
} from 'react-router-dom'

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SectionCards } from "@/components/dashboard/section-cards"
import { SiteHeader } from "@/components/dashboard/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import HelpPage from './HelpPage'
import PluginsPage from './PluginsPage'
import ProductDetailsPage from './ProductDetailsPage'
import ProductsPage from './ProductsPage'
import AddOrEditProductPage from './AddOrEditProductPage'
import SalesHistoryPage from './SalesHistoryPage'
import SalesPage from './SalesPage'
import SettingsPage from './SettingsPage'

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
                  {/* Your application's routing logic is fully preserved. */}
                  <Route path="/" element={<SectionCards />} />
                  <Route path="/dashboard" element={<SectionCards />} />
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/sales/history" element={<SalesHistoryPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/add" element={<AddOrEditProductPage />} />
                  <Route path="/products/edit/:productId" element={<AddOrEditProductPage />} />
                  <Route path="/products/:productId" element={<ProductDetailsPage />} />
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
  )
}
