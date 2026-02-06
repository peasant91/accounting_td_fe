'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useCustomer, useDeleteCustomer } from '@/lib/hooks';
import { Button, StatusBadge, ConfirmDialog, EmptyState } from '@/components/ui';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CustomerListItem } from '@/types';
import { Loader2, ArrowLeft, Mail, Phone, MapPin, CreditCard, FileText, Plus, Eye, Trash2 } from 'lucide-react';

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
            <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading customer details...</span>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
                <h3 className="text-lg font-semibold text-destructive">Error loading customer</h3>
                <p className="text-muted-foreground">The customer could not be found or an error occurred.</p>
                <Button onClick={() => router.push('/customers')} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
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
        <div className="space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/customers" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                            <ArrowLeft className="h-3 w-3" /> Back to Customers
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
                        <StatusBadge status={customer.status} />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
                        Delete
                    </Button>
                </div>
            </header>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
                <div className="bg-card rounded-lg border border-border p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Email
                            </span>
                            <span className="block text-foreground">
                                <a href={`mailto:${customer.email}`} className="hover:underline text-primary">
                                    {customer.email}
                                </a>
                            </span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Phone
                            </span>
                            <span className="block text-foreground">{customer.phone || '-'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Address
                            </span>
                            <span className="block text-foreground whitespace-pre-line">
                                {customer.address_line_1 ? (
                                    <>
                                        {customer.address_line_1}
                                        {customer.address_line_2 && <><br />{customer.address_line_2}</>}
                                        {(customer.city || customer.state || customer.postal_code) && (
                                            <><br />{[customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ')}</>
                                        )}
                                        {customer.country && <><br />{customer.country}</>}
                                    </>
                                ) : (
                                    '-'
                                )}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Tax ID
                            </span>
                            <span className="block text-foreground">{customer.tax_id || '-'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Internal Notes
                            </span>
                            <span className="block text-foreground italic">{customer.notes || '-'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Total Receivable</span>
                            <span className="block text-xl font-bold text-primary">
                                {formatCurrency(customer.total_receivable)}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Invoices</h2>
                    <Link href={`/invoices/new?customer_id=${customer.id}`}>
                        <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Invoice
                        </Button>
                    </Link>
                </div>

                {!customer.invoices || customer.invoices.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No invoices yet"
                        description="This customer has no invoices."
                        action={{
                            label: "Create Invoice",
                            onClick: () => router.push(`/invoices/new?customer_id=${customer.id}`)
                        }}
                    />
                ) : (
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Invoice #</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Due Date</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {customer.invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-primary hover:underline">
                                                {invoice.invoice_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-foreground">{formatDate(invoice.invoice_date)}</td>
                                        <td className="px-4 py-3 text-sm text-foreground">{formatDate(invoice.due_date)}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                                            {formatCurrency(invoice.total)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <StatusBadge status={invoice.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/invoices/${invoice.id}`}>
                                                <Button size="icon" variant="ghost">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
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

            <ConfirmDialog
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={handleDelete}
                title="Delete Customer"
                description={`Are you sure you want to delete "${customer.name}"? This will also delete all associated invoices.`}
                confirmText="Delete"
                loading={deleteCustomer.isPending}
            />
        </div>
    );
}
