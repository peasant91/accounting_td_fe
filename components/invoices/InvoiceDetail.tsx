'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, ConfirmDialog, ErrorState, LoadingState, StatusBadge, TypeBadge } from '@/components/ui';
import { useInvoice, useDeleteInvoice } from '@/lib/hooks';
import { formatDate, formatCurrency, getTotalDue } from '@/lib/utils';
import { useState } from 'react';
import { SendInvoiceModal, MarkAsPaidModal, CancelInvoiceModal, InvoicePrintView } from '@/components/invoices';
import { useInvoicePreview } from '@/lib/hooks/useInvoiceTemplates';
import { ArrowLeft, Printer } from 'lucide-react';

interface InvoiceDetailProps {
    invoiceId: number;
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
    const router = useRouter();
    const { data: invoiceData, isLoading, error } = useInvoice(invoiceId);
    const deleteInvoice = useDeleteInvoice();
    const invoice = invoiceData?.data;

    const { data: previewData } = useInvoicePreview(invoice?.customer?.id || 0, !!invoice?.customer?.id);
    const preview = previewData?.data;

    const handlePrint = () => {
        window.print();
    };

    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const handleEdit = () => {
        router.push(`/invoices/${invoiceId}/edit`);
    };

    if (isLoading) {
        return <LoadingState message="Loading invoice details..." />;
    }

    if (error || !invoice) {
        return (
            <ErrorState
                title="Error loading invoice"
                description={`Could not find invoice with ID ${invoiceId}`}
                action={{ label: 'Back to Invoices', onClick: () => router.push('/invoices') }}
            />
        );
    }

    return (
        <div>
            <SendInvoiceModal
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoice_number}
                customerEmail={invoice.customer.email}
            />
            <MarkAsPaidModal
                isOpen={isMarkPaidModalOpen}
                onClose={() => setIsMarkPaidModalOpen(false)}
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoice_number}
                totalAmount={getTotalDue(invoice)}
                currency={invoice.currency}
            />
            <CancelInvoiceModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoice_number}
            />
            <ConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={() => deleteInvoice.mutateAsync(invoiceId).then(() => router.push('/invoices'))}
                title="Delete Invoice"
                description="This action cannot be undone. The invoice will be permanently deleted."
                confirmText="Delete"
                loading={deleteInvoice.isPending}
            />

            <div className="space-y-6 print:hidden">
                {/* Header with Actions */}
                <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/invoices')}>
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-foreground">{invoice.invoice_number}</h1>
                            <StatusBadge status={invoice.status} />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {invoice.status === 'draft' && (
                            <>
                                <Button variant="ghost" onClick={() => setIsDeleteOpen(true)}>Delete</Button>
                                <Button variant="secondary" onClick={handleEdit}>Edit</Button>
                                <Button onClick={() => setIsSendModalOpen(true)}>Send to Customer</Button>
                            </>
                        )}
                        {invoice.status === 'sent' && (
                            <>
                                <Button variant="outline" onClick={() => setIsCancelModalOpen(true)}>Cancel Invoice</Button>
                                <Button variant="secondary" onClick={() => setIsSendModalOpen(true)}>Resend Info</Button>
                                <Button onClick={() => setIsMarkPaidModalOpen(true)}>Mark as Paid</Button>
                            </>
                        )}
                        {invoice.status === 'overdue' && (
                            <>
                                <Button variant="outline" onClick={() => setIsCancelModalOpen(true)}>Cancel Invoice</Button>
                                <Button variant="secondary" onClick={() => setIsSendModalOpen(true)}>Send Reminder</Button>
                                <Button onClick={() => setIsMarkPaidModalOpen(true)}>Mark as Paid</Button>
                            </>
                        )}
                        {invoice.status === 'paid' && (
                            <Button
                                variant="secondary"
                                disabled={!invoice.payment_proof_url}
                                onClick={() => {
                                    if (invoice.payment_proof_url) {
                                        window.open(invoice.payment_proof_url, '_blank', 'noreferrer');
                                    }
                                }}
                            >
                                View Proof of payment
                            </Button>
                        )}
                        <Button variant="ghost" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            Print / PDF
                        </Button>
                    </div>
                </header>

                {/* Invoice Content */}
                <div className="bg-card rounded-lg border border-border p-6 space-y-8">
                    {/* Top Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                            <div>
                                <p className="font-semibold text-foreground">{invoice.customer.company_name || invoice.customer.name}</p>
                                {invoice.customer.company_name && (
                                    <p className="text-sm text-foreground">{invoice.customer.name}</p>
                                )}
                                <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
                                {invoice.customer.address_line_1 && (
                                    <p className="text-sm text-muted-foreground">{invoice.customer.address_line_1}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Invoice Date</h3>
                                <p className="text-foreground">{formatDate(invoice.invoice_date)}</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                                <div className="flex items-center gap-2">
                                    {invoice.type && <TypeBadge type={invoice.type} />}
                                    {invoice.type === 'recurring' && invoice.recurring_invoice_id && invoice.customer_id && (
                                        <Link href={`/customers/${invoice.customer_id}/recurring/${invoice.recurring_invoice_id}/edit`} className="text-xs text-primary hover:underline">
                                            View Template
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                            <p className="text-foreground">{invoice.due_date ? formatDate(invoice.due_date) : '-'}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Amount Due</h3>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(getTotalDue(invoice), invoice.currency)}</p>
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Items</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border">
                                <tr>
                                    <th className="py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                                    <th className="py-3 text-right text-sm font-medium text-muted-foreground">Qty</th>
                                    <th className="py-3 text-right text-sm font-medium text-muted-foreground">Unit Price</th>
                                    <th className="py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 text-foreground">
                                            <div>{item.description}</div>
                                            {item.notes && (
                                                <div className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                                                    {item.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 text-right text-muted-foreground align-top">{item.quantity}</td>
                                        <td className="py-3 text-right text-muted-foreground align-top">{formatCurrency(item.unit_price, invoice.currency)}</td>
                                        <td className="py-3 text-right font-medium text-foreground align-top">{formatCurrency(item.amount, invoice.currency)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax ({invoice.tax_rate}%)</span>
                            <span className="text-foreground">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                        </div>
                        {invoice.use_unique_code && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Unique Code +{String(invoice.unique_code ?? 0).padStart(3, '0')}
                                </span>
                                <span className="text-indigo-600">
                                    +{formatCurrency(invoice.unique_code ?? 0, invoice.currency)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                            <span>{invoice.use_unique_code ? 'Total to Pay' : 'Total'}</span>
                            <span className="text-primary">{formatCurrency(getTotalDue(invoice), invoice.currency)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {(invoice.notes || invoice.internal_notes) && (
                    <div className="space-y-4 border-t border-border pt-6">
                        {invoice.notes && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Notes for Customer</h3>
                                <p className="text-foreground">{invoice.notes}</p>
                            </div>
                        )}
                        {invoice.internal_notes && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Internal Notes</h3>
                                <p className="text-muted-foreground italic">{invoice.internal_notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>


            {preview && invoice && (
                <div className="hidden print:block">
                    <InvoicePrintView
                        template={preview.template}
                        locale={preview.locale}
                        invoice={{
                            ...preview.sample_invoice,
                            invoice_number: invoice.invoice_number,
                            invoice_date: invoice.invoice_date,
                            customer_name: invoice.customer.company_name || invoice.customer.name,
                            items: invoice.items,
                            subtotal: invoice.subtotal,
                            tax_rate: invoice.tax_rate,
                            tax_amount: invoice.tax_amount,
                            total: invoice.total,
                            use_unique_code: invoice.use_unique_code,
                            unique_code: invoice.unique_code,
                            currency: invoice.currency,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
