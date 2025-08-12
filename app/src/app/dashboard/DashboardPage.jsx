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

const SalesPage = () => <div className="p-6"><h1>Sales Page</h1><p>Content for sales.</p></div>
const AnalyticsPage = () => <div className="p-6"><h1>Analytics Page</h1><p>Content for analytics.</p></div>
const ProductsPage = () => <div className="p-6"><h1>Products Page</h1><p>Content for products.</p></div>
const SalesHistoryPage = () => <div className="p-6"><h1>Sales History Page</h1><p>Content for sales history.</p></div>
const PluginsPage = () => <div className="p-6"><h1>Plugins Page</h1><p>Content for plugins.</p></div>
const SettingsPage = () => <div className="p-6"><h1>Settings Page</h1><p>Content for settings.</p></div>
const HelpPage = () => <div className="p-6"><h1>Help Page</h1><p>Content for help.</p></div>


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
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/sales-history" element={<SalesHistoryPage />} />
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
