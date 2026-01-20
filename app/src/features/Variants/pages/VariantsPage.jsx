import { Layers, Package, ClipboardList } from "lucide-react"
import VariantsTable from "../components/VariantsTable"
import GenericPageHeader from "@/components/common/GenericPageHeader"

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
  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
      <div className="w-full">
        <GenericPageHeader
          headerIcon={<Layers className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          headerLabel={"All Product Variants"}
          actions={variantsActions}
        />
      </div>

      <VariantsTable />
    </div>
  );
};
