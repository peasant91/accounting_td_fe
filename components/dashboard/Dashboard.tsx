'use client';

import { useDashboard } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils';
import { SummaryCard } from './SummaryCard';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { Loader2 } from 'lucide-react';

export function Dashboard() {
    const { data, isLoading, error } = useDashboard();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-center">
                <h3 className="text-lg font-semibold text-destructive">Error loading dashboard</h3>
                <p className="text-muted-foreground">Please try again later.</p>
            </div>
        );
    }

    const summary = data?.data;

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your accounting activity</p>
                </div>
                <QuickActions />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SummaryCard
                    title="Total Receivables"
                    value={formatCurrency(summary?.total_receivables || 0)}
                    icon="💰"
                    variant="default"
                    href="/invoices?status=unpaid"
                />

                <SummaryCard
                    title="Active Customers"
                    value={summary?.total_customers || 0}
                    icon="👥"
                    variant="default"
                    href="/customers"
                />

                <SummaryCard
                    title="Due This Month"
                    value={`${summary?.invoices_due_this_month?.count || 0} invoices`}
                    subValue={formatCurrency(summary?.invoices_due_this_month?.amount || 0)}
                    icon="📅"
                    variant="default"
                    href="/invoices?due=this_month"
                />
            </div>

            <RecentActivity activities={summary?.recent_activity || []} />
        </div>
    );
}
