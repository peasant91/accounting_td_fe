'use client';

import styles from './InvoiceList.module.css';
import { useState } from 'react';
import Link from 'next/link';
import { useInvoices, useDeleteInvoice } from '@/lib/hooks';
import { Button, EmptyState, StatusBadge, ConfirmModal } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoiceListItem, InvoiceStatus } from '@/types';

export function InvoiceList() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
    const [deletingInvoice, setDeletingInvoice] = useState<InvoiceListItem | null>(null);

    const { data, isLoading, error } = useInvoices({
        search,
        status: statusFilter || undefined,
    });
    const deleteInvoice = useDeleteInvoice();

    const handleDelete = async () => {
        if (deletingInvoice) {
            await deleteInvoice.mutateAsync(deletingInvoice.id);
            setDeletingInvoice(null);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <span>Loading invoices...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.error}>
                <h3>Error loading invoices</h3>
                <p>Please try again later.</p>
            </div>
        );
    }

    const invoices = data?.data || [];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Invoices</h1>
                    <p className={styles.subtitle}>Manage and track your invoices</p>
                </div>
                <Link href="/invoices/new">
                    <Button>+ Create Invoice</Button>
                </Link>
            </header>

            <div className={styles.toolbar}>
                <input
                    type="text"
                    placeholder="Search invoices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
                    className={styles.filterSelect}
                >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {invoices.length === 0 ? (
                <EmptyState
                    icon="📄"
                    title="No invoices yet"
                    description="Create your first invoice to start billing your customers."
                    actionLabel="Create Invoice"
                    onAction={() => window.location.href = '/invoices/new'}
                />
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className={styles.invoiceNumber}>
                                        <Link href={`/invoices/${invoice.id}`}>
                                            {invoice.invoice_number}
                                        </Link>
                                    </td>
                                    <td>{invoice.customer.name}</td>
                                    <td>{formatDate(invoice.invoice_date)}</td>
                                    <td>{formatDate(invoice.due_date)}</td>
                                    <td className={styles.amountCell}>
                                        {formatCurrency(invoice.total)}
                                    </td>
                                    <td>
                                        <StatusBadge status={invoice.status} />
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link href={`/invoices/${invoice.id}`}>
                                                <Button variant="ghost" size="sm">View</Button>
                                            </Link>
                                            {invoice.status === 'draft' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeletingInvoice(invoice)}
                                                >
                                                    Delete
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

            <ConfirmModal
                isOpen={!!deletingInvoice}
                onClose={() => setDeletingInvoice(null)}
                onConfirm={handleDelete}
                title="Delete Invoice"
                message={`Are you sure you want to delete invoice "${deletingInvoice?.invoice_number}"?`}
                confirmText="Delete"
                loading={deleteInvoice.isPending}
            />
        </div>
    );
}
