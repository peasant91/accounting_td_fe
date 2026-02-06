'use client';

import styles from './Dashboard.module.css';
import { useDashboard } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils';
import { SummaryCard } from './SummaryCard';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';

export function Dashboard() {
    const { data, isLoading, error } = useDashboard();

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <span>Loading dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.error}>
                <h3>Error loading dashboard</h3>
                <p>Please try again later.</p>
            </div>
        );
    }

    const summary = data?.data;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <h1 className={styles.title}>Dashboard</h1>
                        <p className={styles.subtitle}>Overview of your accounting activity</p>
                    </div>
                    <QuickActions />
                </div>
            </header>

            <div className={styles.statsGrid}>
                <SummaryCard
                    title="Total Receivables"
                    value={formatCurrency(summary?.total_receivables || 0)}
                    icon="💰"
                    accentClass={styles.receivables}
                    href="/invoices?status=unpaid"
                />

                <SummaryCard
                    title="Active Customers"
                    value={summary?.total_customers || 0}
                    icon="👥"
                    accentClass={styles.customers}
                    href="/customers"
                />

                <SummaryCard
                    title="Due This Month"
                    value={`${summary?.invoices_due_this_month?.count || 0} invoices`}
                    subValue={formatCurrency(summary?.invoices_due_this_month?.amount || 0)}
                    icon="📅"
                    accentClass={styles.dueThisMonth}
                    href="/invoices?due=this_month"
                />
            </div>

            <RecentActivity activities={summary?.recent_activity || []} />
        </div>
    );
}
