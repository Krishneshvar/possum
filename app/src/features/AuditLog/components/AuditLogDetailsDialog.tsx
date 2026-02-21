import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseJson } from '@/utils/json.utils';
import type { AuditLog } from '@shared/index';

interface AuditLogDetailsDialogProps {
    log: AuditLog | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AuditLogDetailsDialog({ log, open, onOpenChange }: AuditLogDetailsDialogProps) {
    if (!log) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Audit Log Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 mt-4">
                    <div className="space-y-6 pr-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Action</p>
                                <p className="font-medium capitalize">{log.action}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">User</p>
                                <p className="font-medium">{log.user_name || 'System'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Resource</p>
                                <p className="font-medium capitalize">{log.table_name?.replace(/_/g, ' ') || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Resource ID</p>
                                <p className="font-medium">{log.row_id || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Timestamp</p>
                                <p className="font-medium">{format(new Date(log.created_at!), "MMM dd, yyyy HH:mm:ss")}</p>
                            </div>
                        </div>

                        {log.event_details && (
                            <div>
                                <p className="text-sm font-semibold mb-2">Event Details</p>
                                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                                    {JSON.stringify(parseJson(log.event_details), null, 2)}
                                </pre>
                            </div>
                        )}

                        {log.old_data && (
                            <div>
                                <p className="text-sm font-semibold mb-2">Previous Data</p>
                                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                                    {JSON.stringify(parseJson(log.old_data), null, 2)}
                                </pre>
                            </div>
                        )}

                        {log.new_data && (
                            <div>
                                <p className="text-sm font-semibold mb-2">New Data</p>
                                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                                    {JSON.stringify(parseJson(log.new_data), null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
