import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const getActionBadge = (action) => {
    let className = "bg-secondary text-secondary-foreground";
    switch (action) {
        case 'create':
            className = "bg-success/10 text-success border-success/20";
            break;
        case 'update':
            className = "bg-info/10 text-info border-info/20";
            break;
        case 'delete':
            className = "bg-destructive/10 text-destructive border-destructive/20";
            break;
        case 'login':
            className = "bg-primary/10 text-primary border-primary/20";
            break;
        case 'logout':
            className = "bg-warning/10 text-warning border-warning/20";
            break;
    }

    return (
        <Badge variant="outline" className={`${className} font-medium capitalize`}>
            {action}
        </Badge>
    );
};

export const allColumns = [
    {
        key: "created_at",
        label: "Time",
        sortable: true,
        sortField: "created_at",
        renderCell: (log) => (
            <div className="flex flex-col">
                <span className="font-medium text-foreground">
                    {format(new Date(log.created_at), "MMM dd, yyyy")}
                </span>
                <span className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "hh:mm:ss a")}
                </span>
            </div>
        ),
    },
    {
        key: "user_name",
        label: "User",
        sortable: true,
        sortField: "user_name",
        renderCell: (log) => (
            <p className="font-semibold leading-none text-foreground">{log.user_name || "System"}</p>
        ),
    },
    {
        key: "action",
        label: "Action",
        sortable: true,
        sortField: "action",
        renderCell: (log) => getActionBadge(log.action),
    },
    {
        key: "table_name",
        label: "Resource",
        sortable: true,
        sortField: "table_name",
        renderCell: (log) => (
            log.table_name ? (
                <div className="flex flex-col">
                    <span className="text-sm font-medium capitalize">{log.table_name.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">ID: {log.row_id}</span>
                </div>
            ) : (
                <span className="text-sm text-muted-foreground">-</span>
            )
        ),
    },
    {
        key: "details",
        label: "Details",
        renderCell: (log) => {
            let details = "";
            if (log.action === 'login' || log.action === 'logout') {
                try {
                    const eventDetails = JSON.parse(log.event_details || '{}');
                    details = eventDetails.ip ? `IP: ${eventDetails.ip}` : "Session event";
                } catch (e) {
                    details = "Session event";
                }
            } else {
                details = `Modified ${log.table_name || 'record'}`;
            }
            return <p className="text-sm text-muted-foreground max-w-[200px] truncate">{details}</p>;
        },
    },
];
