'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useCustomer, useDeleteCustomer, useCustomerOrders } from '@/lib/hooks';
import { Button, StatusBadge, ConfirmDialog, EmptyState, LoadingState, ErrorState } from '@/components/ui';
import { InvoiceTemplateBuilder } from '@/components/invoices/InvoiceTemplateBuilder';
import { RecurringInvoiceList } from '@/components/recurring/RecurringInvoiceList';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/types/order';
import { Loader2, ArrowLeft, Mail, Phone, MapPin, CreditCard, FileText, Plus, Eye, ClipboardList } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);


    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { data, isLoading, error, isRefetching } = useCustomer(id);
    const deleteCustomer = useDeleteCustomer();
    const { user } = useAuth();
    const isSales = user?.role === 'sales';
    const { data: ordersData } = useCustomerOrders(id);
    const customerOrders = ordersData?.data ?? [];

    const customer = data?.data;

    const handleDelete = async () => {
        await deleteCustomer.mutateAsync(id);
        router.push('/customers');
    };

    if (isLoading) {
        return <LoadingState message="Loading customer details..." />;
    }

    if (error || !customer) {
        return (
            <ErrorState
                title="Error loading customer"
                description="The customer could not be found or an error occurred."
                action={{ label: 'Back to Customers', onClick: () => router.push('/customers') }}
            />
        );
    }



    return (
        <div className="space-y-8 relative">
            {isRefetching && (
                <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
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
                    <Link href={`/customers/${id}/edit`}>
                        <Button variant="outline">
                            Edit
                        </Button>
                    </Link>
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
                            <span className="text-sm font-medium text-muted-foreground">Company Name</span>
                            <span className="block text-foreground">{customer.company_name || '-'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Currency</span>
                            <span className="block text-foreground">{customer.currency || 'IDR'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Total Receivable</span>
                            <span className="block text-xl font-bold text-primary">
                                {formatCurrency(customer.total_receivable, customer.currency)}
                            </span>
                        </div>
                        {(customer.maintenance_fee || customer.maintenance_type) && (
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Maintenance</span>
                                <div className="flex items-center gap-2">
                                    {customer.maintenance_fee && (
                                        <span className="block font-medium text-foreground">
                                            {formatCurrency(parseFloat(customer.maintenance_fee), customer.currency)}
                                        </span>
                                    )}
                                    {customer.maintenance_type && (
                                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">
                                            {customer.maintenance_type}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>


            </section>

            <InvoiceTemplateBuilder customerId={customer.id} />

            <section className="space-y-4">
                <RecurringInvoiceList customerId={customer.id} />
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Invoices</h2>
                    {!isSales && (
                        <Link href={`/invoices/new?customer_id=${customer.id}`}>
                            <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Invoice
                            </Button>
                        </Link>
                    )}
                </div>

                {!customer.invoices || customer.invoices.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No invoices yet"
                        description="This customer has no invoices."
                        action={!isSales ? {
                            label: "Create Invoice",
                            onClick: () => router.push(`/invoices/new?customer_id=${customer.id}`)
                        } : undefined}
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
                                        <td className="px-4 py-3 text-sm text-foreground">{invoice.due_date ? formatDate(invoice.due_date) : '-'}</td>
                                        <td className={`px-4 py-3 text-sm text-right font-medium ${invoice.use_unique_code ? 'text-indigo-600' : 'text-foreground'}`}>
                                            {formatCurrency(invoice.total, invoice.currency)}
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



            {/* Orders Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Orders</h2>
                    {!isSales && (
                        <Link href={`/orders/new?customer_id=${customer.id}`}>
                            <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                New Order
                            </Button>
                        </Link>
                    )}
                </div>

                {customerOrders.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="No orders yet"
                        description="This customer has no orders."
                        action={!isSales ? {
                            label: "New Order",
                            onClick: () => router.push(`/orders/new?customer_id=${customer.id}`)
                        } : undefined}
                    />
                ) : (
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Total</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Paid</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Remaining</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {customerOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link href={`/orders/${order.id}`} className="text-sm font-medium text-primary hover:underline">
                                                {order.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">
                                            {formatCurrency(parseFloat(order.total_price), customer.currency ?? 'IDR')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-green-700">
                                            {formatCurrency(parseFloat(order.total_paid), customer.currency ?? 'IDR')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-orange-600">
                                            {formatCurrency(parseFloat(order.remaining_balance), customer.currency ?? 'IDR')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                                                {ORDER_STATUS_LABELS[order.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/orders/${order.id}`}>
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

            <ConfirmDialog
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={handleDelete}
                title="Delete Customer"
                description={`Are you sure you want to delete "${customer.name}"? This will also delete all associated invoices.`}
                confirmText="Delete"
                loading={deleteCustomer.isPending}
            />
        </div >
    );
}
