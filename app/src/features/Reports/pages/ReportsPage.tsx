import { BarChart3 } from "lucide-react";
import GenericPageHeader from "@/components/common/GenericPageHeader";
import SalesReportPage from "./SalesReportPage";

export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-6">
            <GenericPageHeader
                headerIcon={<BarChart3 className="h-6 w-6 text-primary" />}
                headerLabel="Reports"
            />
            <SalesReportPage />
        </div>
    );
}
