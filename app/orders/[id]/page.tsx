'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrder, useUpdateOrder } from '@/lib/hooks';
import { Button, ConfirmDialog, EmptyState, ErrorState, LoadingState, PriceInput } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/types/order';
import { ArrowLeft, FileText, Plus } from 'lucide-react';

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const { data, isLoading, error } = useOrder(id);
    const updateOrder = useUpdateOrder();
    const { user } = useAuth();
    const isSales = user?.role === 'sales';
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        total_price: '',
        deposit_amount: '',
        maintenance_price: '',
        date_of_contract: '',
        jp: '',
        source: '',
        sales_pic: '',
        notes: '',
    });

    if (isLoading) {
        return <LoadingState message="Loading order details..." />;
    }

    if (error || !data?.data) {
        return (
            <ErrorState
                title="Error loading order"
                description="The order could not be found or an error occurred."
                action={{ label: 'Back to Orders', onClick: () => router.push('/orders') }}
            />
        );
    }

    const order = data.data;
    const currency = order.customer?.currency ?? 'IDR';

    const handleCancel = async () => {
        await updateOrder.mutateAsync({ id: order.id, data: { status: 'cancelled' } });
        setIsCancelOpen(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/orders" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                            <ArrowLeft className="h-3 w-3" /> Back to Orders
                        </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold text-foreground">{order.title}</h1>
                        {order.invoice_type && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium">
                                {order.invoice_type.code}
                            </span>
                        )}
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                            {ORDER_STATUS_LABELS[order.status]}
                        </span>
                    </div>
                    {order.customer && (
                        <p className="text-muted-foreground mt-1">{order.customer.company_name}</p>
                    )}
                </div>
                {!isSales && order.status !== 'cancelled' && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                            setEditForm({
                                title: order.title ?? '',
                                total_price: order.total_price ?? '',
                                deposit_amount: order.deposit_amount ?? '',
                                maintenance_price: order.maintenance_price ?? '',
                                date_of_contract: order.date_of_contract ?? '',
                                jp: order.jp ?? '',
                                source: order.source ?? '',
                                sales_pic: order.sales_pic ?? '',
                                notes: order.notes ?? '',
                            });
                            setIsEditOpen(true);
                        }}>
                            Edit
                        </Button>
                        <Button variant="destructive" onClick={() => setIsCancelOpen(true)}>
                            Cancel Order
                        </Button>
                    </div>
                )}
            </header>

            {/* Financial summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg border border-border p-4 space-y-1">
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(parseFloat(order.total_price), currency)}</p>
                </div>
                <div className="bg-card rounded-lg border border-border p-4 space-y-1">
                    <p className="text-sm text-muted-foreground">Deposit</p>
                    <p className="text-xl font-bold text-foreground">
                        {order.deposit_amount ? formatCurrency(parseFloat(order.deposit_amount), currency) : '-'}
                    </p>
                </div>
                <div className="bg-card rounded-lg border border-border p-4 space-y-1">
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(parseFloat(order.total_paid), currency)}</p>
                </div>
                <div className="bg-card rounded-lg border border-border p-4 space-y-1">
                    {(() => {
                        const remaining = parseFloat(order.remaining_balance);
                        return remaining < 0 ? (
                            <>
                                <p className="text-sm text-muted-foreground">Overpaid</p>
                                <p className="text-xl font-bold text-amber-600">{formatCurrency(Math.abs(remaining), currency)}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">Remaining Balance</p>
                                <p className="text-xl font-bold text-orange-600">{formatCurrency(remaining, currency)}</p>
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Status timeline */}
            <section className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-4">Payment Progress</h2>
                {order.status === 'cancelled' ? (
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-sm font-medium">
                            Cancelled
                        </span>
                        <span className="text-sm text-muted-foreground">This order has been cancelled.</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center">
                            {(['not_yet', 'deposit_only', 'payment_completed'] as const).map((step, i) => {
                                const steps = ['not_yet', 'deposit_only', 'payment_completed'] as const;
                                const currentIndex = steps.indexOf(order.status as typeof steps[number]);
                                const stepIndex = i;
                                const isActive = stepIndex === currentIndex;
                                const isDone = stepIndex < currentIndex;
                                return (
                                    <React.Fragment key={step}>
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                                isActive ? 'bg-primary text-primary-foreground' :
                                                isDone ? 'bg-primary/20 text-primary' :
                                                'bg-muted text-muted-foreground'
                                            }`}>
                                                {isDone ? '✓' : stepIndex + 1}
                                            </div>
                                            <span className={`text-xs whitespace-nowrap ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                {ORDER_STATUS_LABELS[step]}
                                            </span>
                                        </div>
                                        {i < 2 && (
                                            <div className={`flex-1 h-0.5 mx-2 mb-5 ${isDone ? 'bg-primary/40' : 'bg-muted'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            Paid {formatCurrency(parseFloat(order.total_paid), currency)} of {formatCurrency(parseFloat(order.total_price), currency)} total
                        </p>
                    </>
                )}
            </section>

            {/* Details */}
            <section className="bg-card rounded-lg border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">JP</p>
                        <p className="text-sm font-medium text-foreground">{order.jp ?? '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Source</p>
                        <p className="text-sm font-medium text-foreground">{order.source ?? '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Sales PIC</p>
                        <p className="text-sm font-medium text-foreground">{order.sales_pic ?? '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Contract Date</p>
                        <p className="text-sm font-medium text-foreground">
                            {order.date_of_contract ? formatDate(order.date_of_contract) : '-'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Maintenance Price</p>
                        <p className="text-sm font-medium text-foreground">
                            {order.maintenance_price ? formatCurrency(parseFloat(order.maintenance_price), currency) : '-'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Notes */}
            {order.notes && (
                <section className="bg-card rounded-lg border border-border p-6 space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">Notes</h2>
                    <p className="text-sm text-foreground whitespace-pre-line">{order.notes}</p>
                </section>
            )}

            {/* Invoices */}
            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-foreground">Invoices</h2>
                    {!isSales && (
                        <div className="flex gap-2">
                            <Link href={`/invoices/new?order_id=${order.id}`}>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Create Invoice
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {order.maintenance_price && !isSales && order.customer && (
                    <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4 text-sm flex items-center justify-between gap-4">
                        <div className="text-indigo-700">
                            <span className="font-medium text-indigo-900">Maintenance Price set:</span>{' '}
                            {formatCurrency(parseFloat(order.maintenance_price), currency)} — create a maintenance invoice for this customer.
                        </div>
                        <Link href={`/invoices/new?customer_id=${order.customer.id}`}>
                            <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-1" />
                                Maintenance Invoice
                            </Button>
                        </Link>
                    </div>
                )}

                {!order.invoices || order.invoices.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No invoices yet"
                        description="Create an invoice linked to this order."
                        action={!isSales ? {
                            label: "Create Invoice",
                            onClick: () => router.push(`/invoices/new?order_id=${order.id}`)
                        } : undefined}
                    />
                ) : (
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Invoice #</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {order.invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-primary hover:underline">
                                                {invoice.invoice_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {invoice.invoice_date ? formatDate(invoice.invoice_date) : '-'}
                                        </td>
                                        <td className={`px-4 py-3 text-sm text-right font-medium ${invoice.use_unique_code ? 'text-indigo-600' : ''}`}>
                                            {formatCurrency(parseFloat(invoice.total), currency)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                                                {invoice.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <ConfirmDialog
                open={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                onConfirm={handleCancel}
                title="Cancel Order"
                description={`Are you sure you want to cancel the order "${order.title}"? This action cannot be undone.`}
                confirmText="Cancel Order"
                loading={updateOrder.isPending}
            />

            {isEditOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg border border-border p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold">Edit Order</h2>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Title</label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={editForm.title}
                                    onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Total Price</label>
                                    <PriceInput value={editForm.total_price} onChange={v => setEditForm(p => ({ ...p, total_price: v }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Deposit Amount</label>
                                    <PriceInput value={editForm.deposit_amount} onChange={v => setEditForm(p => ({ ...p, deposit_amount: v }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Maintenance Price</label>
                                    <PriceInput value={editForm.maintenance_price} onChange={v => setEditForm(p => ({ ...p, maintenance_price: v }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Contract Date</label>
                                    <input
                                        type="date"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={editForm.date_of_contract}
                                        onChange={e => setEditForm(p => ({ ...p, date_of_contract: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">JP</label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={editForm.jp}
                                        onChange={e => setEditForm(p => ({ ...p, jp: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Source</label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={editForm.source}
                                        onChange={e => setEditForm(p => ({ ...p, source: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-sm font-medium">Sales PIC</label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={editForm.sales_pic}
                                        onChange={e => setEditForm(p => ({ ...p, sales_pic: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Notes</label>
                                <textarea
                                    rows={3}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                                    value={editForm.notes}
                                    onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button
                                onClick={async () => {
                                    await updateOrder.mutateAsync({
                                        id: order.id,
                                        data: {
                                            title: editForm.title,
                                            total_price: Number(editForm.total_price) || undefined,
                                            deposit_amount: editForm.deposit_amount ? Number(editForm.deposit_amount) : null,
                                            maintenance_price: editForm.maintenance_price ? Number(editForm.maintenance_price) : null,
                                            date_of_contract: editForm.date_of_contract || null,
                                            jp: editForm.jp || null,
                                            source: editForm.source || null,
                                            sales_pic: editForm.sales_pic || null,
                                            notes: editForm.notes || null,
                                        },
                                    });
                                    setIsEditOpen(false);
                                }}
                                disabled={updateOrder.isPending}
                            >
                                {updateOrder.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
