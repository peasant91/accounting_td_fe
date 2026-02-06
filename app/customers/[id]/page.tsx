'use client';

import styles from './page.module.css';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useCustomer, useDeleteCustomer } from '@/lib/hooks';
import { Button, StatusBadge, ConfirmModal, EmptyState } from '@/components/ui';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CustomerListItem } from '@/types';

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { data, isLoading, error } = useCustomer(id);
    const deleteCustomer = useDeleteCustomer();

    const customer = data?.data;

    const handleDelete = async () => {
        await deleteCustomer.mutateAsync(id);
        router.push('/customers');
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <span>Loading customer details...</span>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className={styles.error}>
                <h3>Error loading customer</h3>
                <p>The customer could not be found or an error occurred.</p>
                <Button onClick={() => router.push('/customers')} variant="outline">
                    Back to Customers
                </Button>
            </div>
        );
    }

    // Convert customer to list item format for modal compatibility
    const customerListItem: CustomerListItem = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        total_receivable: customer.total_receivable,
        status: customer.status,
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>{customer.name}</h1>
                    <div className={styles.badges}>
                        <StatusBadge status={customer.status} />
                    </div>
                </div>
                <div className={styles.actions}>
                    <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
                        Delete
                    </Button>
                </div>
            </header>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Profile Information</h2>
                </div>
                <div className={styles.profileCard}>
                    <div className={styles.profileGrid}>
                        <div className={styles.profileItem}>
                            <span className={styles.label}>Email</span>
                            <span className={styles.value}>
                                <a href={`mailto:${customer.email}`}>{customer.email}</a>
                            </span>
                        </div>
                        <div className={styles.profileItem}>
                            <span className={styles.label}>Phone</span>
                            <span className={styles.value}>{customer.phone || '-'}</span>
                        </div>
                        <div className={styles.profileItem}>
                            <span className={styles.label}>Address</span>
                            <span className={styles.value}>
                                {customer.address_line_1}
                                {customer.address_line_2 && <><br />{customer.address_line_2}</>}
                                {(customer.city || customer.state || customer.postal_code) && (
                                    <><br />{[customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ')}</>
                                )}
                                {customer.country && <><br />{customer.country}</>}
                                {!customer.address_line_1 && !customer.city && '-'}
                            </span>
                        </div>
                        <div className={styles.profileItem}>
                            <span className={styles.label}>Tax ID</span>
                            <span className={styles.value}>{customer.tax_id || '-'}</span>
                        </div>
                        <div className={styles.profileItem}>
                            <span className={styles.label}>Internal Notes</span>
                            <span className={styles.value}>{customer.notes || '-'}</span>
                        </div>
                        <div className={styles.profileItem}>
                            <span className={styles.label}>Total Receivable</span>
                            <span className={`${styles.value} ${styles.amount}`}>
                                {formatCurrency(customer.total_receivable)}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Invoices</h2>
                    <Link href={`/invoices/new?customer_id=${customer.id}`}>
                        <Button size="sm" variant="outline">+ Create Invoice</Button>
                    </Link>
                </div>

                {!customer.invoices || customer.invoices.length === 0 ? (
                    <EmptyState
                        icon="📄"
                        title="No invoices yet"
                        description="This customer has no invoices."
                        actionLabel="Create Invoice"
                        onAction={() => router.push(`/invoices/new?customer_id=${customer.id}`)}
                    />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Date</th>
                                    <th>Due Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customer.invoices.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td className={styles.invoiceNumber}>
                                            <Link href={`/invoices/${invoice.id}`}>
                                                {invoice.invoice_number}
                                            </Link>
                                        </td>
                                        <td>{formatDate(invoice.invoice_date)}</td>
                                        <td>{formatDate(invoice.due_date)}</td>
                                        <td className={styles.amount}>
                                            {formatCurrency(invoice.total)}
                                        </td>
                                        <td>
                                            <StatusBadge status={invoice.status} />
                                        </td>
                                        <td>
                                            <Link href={`/invoices/${invoice.id}`}>
                                                <Button size="sm" variant="ghost">View</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <CustomerModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                customer={customerListItem}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Customer"
                message={`Are you sure you want to delete "${customer.name}"? This will also delete all associated invoices.`}
                confirmText="Delete"
                loading={deleteCustomer.isPending}
            />
        </div>
    );
}
