'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrders, useInvoiceTypes } from '@/lib/hooks';
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/order';
import { ClipboardList, Plus } from 'lucide-react';

export default function OrdersPage() {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
    const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<number | undefined>(undefined);

    const { data: invoiceTypesData } = useInvoiceTypes();
    const invoiceTypes = invoiceTypesData?.data ?? [];

    const { data, isLoading, error } = useOrders({
        status: statusFilter || undefined,
        invoice_type_id: invoiceTypeFilter,
    });
    const { user } = useAuth();
    const isSales = user?.role === 'sales';

    if (isLoading) {
        return <LoadingState message="Loading orders..." />;
    }

    if (error) {
        return <ErrorState title="Error loading orders" />;
    }

    const orders = data?.data ?? [];

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Orders</h1>
                    <p className="text-muted-foreground mt-1">Manage and track your orders</p>
                </div>
                {!isSales && (
                    <Link href="/orders/new">
                        <Button>
                            <Plus className="h-4 w-4" />
                            New Order
                        </Button>
                    </Link>
                )}
            </header>

            <div className="flex flex-col sm:flex-row gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">All Status</option>
                    {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                    ))}
                </select>
                <select
                    value={invoiceTypeFilter?.toString() ?? ''}
                    onChange={(e) => setInvoiceTypeFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">All Types</option>
                    {invoiceTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.code} — {t.name}
                        </option>
                    ))}
                </select>
            </div>

            {orders.length === 0 ? (
                <EmptyState
                    icon={ClipboardList}
                    title="No orders yet"
                    description="Create your first order to start tracking project contracts."
                    action={!isSales ? {
                        label: "New Order",
                        onClick: () => router.push('/orders/new')
                    } : undefined}
                />
            ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Total</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Paid</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Remaining</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Sales PIC</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contract Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.map((order) => {
                                const currency = order.customer?.currency ?? 'IDR';
                                return (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/orders/${order.id}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-primary hover:underline">
                                                {order.title}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {order.customer?.company_name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {order.invoice_type ? (
                                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                                    {order.invoice_type.code}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">
                                            {formatCurrency(parseFloat(order.total_price), currency)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-green-700">
                                            {formatCurrency(parseFloat(order.total_paid), currency)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-orange-600">
                                            {formatCurrency(parseFloat(order.remaining_balance), currency)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                                                {ORDER_STATUS_LABELS[order.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {order.sales_pic ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {order.date_of_contract ? formatDate(order.date_of_contract) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
