import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RefreshCw, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface RecurringInvoicesWidgetProps {
    data: {
        generated_today: number;
        upcoming: {
            id: number;
            customer_id: number;
            customer_name: string;
            title: string;
            next_invoice_date: string;
        }[];
    };
}

export function RecurringInvoicesWidget({ data }: RecurringInvoicesWidgetProps) {
    if (!data) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Recurring Invoices
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2 text-2xl font-bold">
                    <span>{data.generated_today}</span>
                    <span className="text-sm font-normal text-muted-foreground">generated today</span>
                </div>

                <div className="mt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Upcoming (7 Days)
                    </h4>

                    {data.upcoming.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No upcoming invoices this week.</p>
                    ) : (
                        <div className="space-y-2">
                            {data.upcoming.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground truncate max-w-[180px]">{item.customer_name}</span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">{item.title}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-medium bg-secondary px-1.5 py-0.5 rounded text-foreground">
                                            {formatDate(item.next_invoice_date)}
                                        </span>
                                        <Link href={`/customers/${item.customer_id}/recurring/${item.id}/edit`} className="text-[10px] text-primary hover:underline mt-0.5">
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
