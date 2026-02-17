import { ClipboardCheck } from "lucide-react"
import AuditLogTable from "../components/AuditLogTable"

export default function AuditLogPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ClipboardCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
                        <p className="text-muted-foreground">
                            Monitor and track all system activities and changes
                        </p>
                    </div>
                </div>
            </div>

            <AuditLogTable />
        </div>
    )
}
