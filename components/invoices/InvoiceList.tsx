'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInvoices, useDeleteInvoice, useDebounce, useCustomers } from '@/lib/hooks';
import { Button, EmptyState, ErrorState, LoadingState, StatusBadge, TypeBadge, ConfirmDialog } from '@/components/ui';
import { formatCurrency, formatDate, getTotalDue } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { InvoiceListItem, InvoiceStatus, InvoiceBillingType } from '@/types';
import { FileText, Plus, Eye, Trash2 } from 'lucide-react';

export function InvoiceList() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
    const [typeFilter, setTypeFilter] = useState<InvoiceBillingType | ''>('');
    const [customerFilter, setCustomerFilter] = useState<number | ''>('');
    const [deletingInvoice, setDeletingInvoice] = useState<InvoiceListItem | null>(null);

    const { data: customersData } = useCustomers({ per_page: 200 });
    const customers = customersData?.data ?? [];

    const { data, isLoading, error } = useInvoices({
        search: debouncedSearch,
        status: statusFilter || undefined,
        billing_type: typeFilter || undefined,
        customer_id: customerFilter || undefined,
    });
    const deleteInvoice = useDeleteInvoice();
    const { user } = useAuth();
    const isSales = user?.role === 'sales';

    const handleDelete = async () => {
        if (deletingInvoice) {
            await deleteInvoice.mutateAsync(deletingInvoice.id);
            setDeletingInvoice(null);
        }
    };

    if (isLoading) {
        return <LoadingState message="Loading invoices..." />;
    }

    if (error) {
        return <ErrorState title="Error loading invoices" />;
    }

    const invoices = data?.data || [];

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
                    <p className="text-muted-foreground mt-1">Manage and track your invoices</p>
                </div>
                {!isSales && (
                    <Link href="/invoices/new">
                        <Button>
                            <Plus className="h-4 w-4" />
                            Create Invoice
                        </Button>
                    </Link>
                )}
            </header>

            <div className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search by invoice no. or amount..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex h-10 w-full sm:max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <select
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value ? Number(e.target.value) : '')}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">All Customers</option>
                    {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.company_name || c.name}
                        </option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as InvoiceBillingType | '')}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">All Types</option>
                    <option value="manual">Manual</option>
                    <option value="recurring">Recurring</option>
                </select>
            </div>

            {invoices.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No invoices yet"
                    description="Create your first invoice to start billing your customers."
                    action={!isSales ? {
                        label: "Create Invoice",
                        onClick: () => router.push('/invoices/new')
                    } : undefined}
                />
            ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Invoice #</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Due Date</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Type</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-primary hover:underline">
                                            {invoice.invoice_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.customer.name}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(invoice.invoice_date)}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.due_date ? formatDate(invoice.due_date) : '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <TypeBadge type={invoice.billing_type} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">
                                        <span className={invoice.use_unique_code ? 'text-indigo-600' : ''}>
                                            {formatCurrency(getTotalDue(invoice), invoice.currency)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={invoice.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/invoices/${invoice.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            {!isSales && invoice.status === 'draft' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingInvoice(invoice)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                open={!!deletingInvoice}
                onOpenChange={(open) => !open && setDeletingInvoice(null)}
                onConfirm={handleDelete}
                title="Delete Invoice"
                description={`Are you sure you want to delete invoice "${deletingInvoice?.invoice_number}"?`}
                confirmText="Delete"
                loading={deleteInvoice.isPending}
            />
        </div>
    );
}
