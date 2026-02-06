'use client';

import styles from './CustomerList.module.css';
import { useState } from 'react';
import Link from 'next/link';
import { useCustomers, useDeleteCustomer } from '@/lib/hooks';
import { Button, EmptyState, StatusBadge, ConfirmModal } from '@/components/ui';
import { CustomerModal } from './CustomerModal';
import { formatCurrency } from '@/lib/utils';
import { CustomerListItem } from '@/types';

export function CustomerList() {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<CustomerListItem | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<CustomerListItem | null>(null);

    const { data, isLoading, error } = useCustomers({ search });
    const deleteCustomer = useDeleteCustomer();

    const handleEdit = (customer: CustomerListItem) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deletingCustomer) {
            await deleteCustomer.mutateAsync(deletingCustomer.id);
            setDeletingCustomer(null);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <span>Loading customers...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.error}>
                <h3>Error loading customers</h3>
                <p>Please try again later.</p>
            </div>
        );
    }

    const customers = data?.data || [];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Customers</h1>
                    <p className={styles.subtitle}>Manage your customer database</p>
                </div>
                <Link href="/customers/new">
                    <Button>+ Add Customer</Button>
                </Link>
            </header>

            <div className={styles.toolbar}>
                <input
                    type="text"
                    placeholder="Search customers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {customers.length === 0 ? (
                <EmptyState
                    icon="👥"
                    title="No customers yet"
                    description="Create your first customer to start sending invoices."
                    actionLabel="Add Customer"
                    onAction={() => window.location.href = '/customers/new'}
                />
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Receivable</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td className={styles.nameCell}>
                                        <Link href={`/customers/${customer.id}`}>
                                            {customer.name}
                                        </Link>
                                    </td>
                                    <td>{customer.email}</td>
                                    <td>{customer.phone || '-'}</td>
                                    <td className={styles.amountCell}>
                                        {formatCurrency(customer.total_receivable)}
                                    </td>
                                    <td>
                                        <StatusBadge status={customer.status} />
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link href={`/customers/${customer.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(customer)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeletingCustomer(customer)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CustomerModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                customer={editingCustomer}
            />

            <ConfirmModal
                isOpen={!!deletingCustomer}
                onClose={() => setDeletingCustomer(null)}
                onConfirm={handleDelete}
                title="Delete Customer"
                message={`Are you sure you want to delete "${deletingCustomer?.name}"? This will also delete all associated invoices.`}
                confirmText="Delete"
                loading={deleteCustomer.isPending}
            />
        </div>
    );
}
