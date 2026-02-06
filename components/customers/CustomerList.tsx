'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCustomers, useDeleteCustomer } from '@/lib/hooks';
import { Button, EmptyState, ConfirmDialog } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { CustomerListItem } from '@/types';
import { Loader2, Users, Plus, Eye, Pencil, Trash2 } from 'lucide-react';

export function CustomerList() {
    const [search, setSearch] = useState('');
    const [deletingCustomer, setDeletingCustomer] = useState<CustomerListItem | null>(null);

    const { data, isLoading, error } = useCustomers({ search });
    const deleteCustomer = useDeleteCustomer();

    const handleDelete = async () => {
        if (deletingCustomer) {
            await deleteCustomer.mutateAsync(deletingCustomer.id);
            setDeletingCustomer(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading customers...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-center">
                <h3 className="text-lg font-semibold text-destructive">Error loading customers</h3>
                <p className="text-muted-foreground">Please try again later.</p>
            </div>
        );
    }

    const customers = data?.data || [];

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Customers</h1>
                    <p className="text-muted-foreground mt-1">Manage your customer database</p>
                </div>
                <Link href="/customers/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Add Customer
                    </Button>
                </Link>
            </header>

            <div className="flex gap-4">
                <input
                    type="text"
                    placeholder="Search customers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
            </div>

            {customers.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No customers yet"
                    description="Create your first customer to start sending invoices."
                    action={{
                        label: "Add Customer",
                        onClick: () => window.location.href = '/customers/new'
                    }}
                />
            ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Phone</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Receivable</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {customers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-primary hover:underline">
                                            {customer.company_name || customer.name}
                                        </Link>
                                        {customer.company_name && (
                                            <div className="text-xs text-muted-foreground">{customer.name}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{customer.email}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{customer.phone || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">
                                        {formatCurrency(customer.total_receivable)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/customers/${customer.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/customers/${customer.id}/edit`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingCustomer(customer)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}



            <ConfirmDialog
                open={!!deletingCustomer}
                onOpenChange={(open) => !open && setDeletingCustomer(null)}
                onConfirm={handleDelete}
                title="Delete Customer"
                description={`Are you sure you want to delete "${deletingCustomer?.name}"? This will also delete all associated invoices.`}
                confirmText="Delete"
                loading={deleteCustomer.isPending}
            />
        </div>
    );
}
