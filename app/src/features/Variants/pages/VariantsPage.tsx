import { Layers, Package, ClipboardList } from "lucide-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import VariantsTable from "../components/VariantsTable"
import GenericPageHeader from "@/components/common/GenericPageHeader"
import { KeyboardShortcut } from "@/components/common/KeyboardShortcut"
import { StatCards } from "@/components/common/StatCards"
import { variantsStatsData } from "../data/variantsStatsData"
import { useGetVariantStatsQuery } from "@/services/productsApi"

const variantsActions = {
  secondary: [
    {
      label: "Products",
      url: "/products",
      icon: Package,
    },
    {
      label: "Inventory",
      url: "/products/inventory",
      icon: ClipboardList,
    }
  ],
};

export default function VariantsPage() {
  const navigate = useNavigate();
  const { data: stats } = useGetVariantStatsQuery();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        navigate('/products');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
      <div className="w-full">
        <GenericPageHeader
          headerIcon={<Layers className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          headerLabel={"Product Variants"}
          actions={variantsActions}
        />
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Quick navigate:</span>
          <KeyboardShortcut keys={["Ctrl", "P"]} />
          <span className="text-muted-foreground/70">to Products</span>
        </div>
      </div>

      <StatCards cardData={variantsStatsData} statsData={stats} />

      <VariantsTable />
    </div>
  );
};
