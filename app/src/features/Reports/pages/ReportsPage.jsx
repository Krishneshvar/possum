import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function ReportsPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Reports & Logs</h1>
            <p className="text-muted-foreground">Select a report to view detailed analytics and logs.</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
                <Link to="/reports/sales">
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">Sales Report</CardTitle>
                            <BarChart className="ml-auto h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Detailed breakdown of sales by day, month, and year including payment methods.
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/audit-log">
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">Audit Log</CardTitle>
                            <ClipboardCheck className="ml-auto h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Monitor system changes, user actions, and administrative activities.
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
