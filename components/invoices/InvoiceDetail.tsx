'use client';

import styles from './InvoiceDetail.module.css';
import { useRouter } from 'next/navigation';
import { Button, StatusBadge } from '@/components/ui';
import { useInvoice, useDeleteInvoice } from '@/lib/hooks';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { SendInvoiceModal, MarkAsPaidModal, CancelInvoiceModal } from '@/components/invoices';

interface InvoiceDetailProps {
    invoiceId: number;
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
    const router = useRouter();
    const { data: invoiceData, isLoading, error } = useInvoice(invoiceId);
    const deleteInvoice = useDeleteInvoice();
    const invoice = invoiceData?.data;

    // Modal states
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const handleEdit = () => {
        router.push(`/invoices/${invoiceId}/edit`);
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            try {
                await deleteInvoice.mutateAsync(invoiceId);
                router.push('/invoices');
            } catch (error) {
                console.error('Failed to delete invoice:', error);
            }
        }
    };

    if (isLoading) {
        return <div className={styles.loading}>Loading invoice details...</div>;
    }

    if (error || !invoice) {
        return (
            <div className={styles.error}>
                <h2>Error loading invoice</h2>
                <p>Could not find invoice with ID {invoiceId}</p>
                <Button onClick={() => router.push('/invoices')}>Back to Invoices</Button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Modals */}
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
                totalAmount={invoice.total}
            />
            <CancelInvoiceModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoice_number}
            />

            {/* Header with Actions */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Button variant="ghost" size="sm" onClick={() => router.push('/invoices')}>
                        ← Back
                    </Button>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>{invoice.invoice_number}</h1>
                        <StatusBadge status={invoice.status} />
                    </div>
                </div>

                <div className={styles.actions}>
                    {invoice.status === 'draft' && (
                        <>
                            <Button variant="ghost" onClick={handleDelete} className={styles.deleteBtn}>Delete</Button>
                            <Button variant="secondary" onClick={handleEdit}>Edit</Button>
                            <Button variant="primary" onClick={() => setIsSendModalOpen(true)}>Send to Customer</Button>
                        </>
                    )}
                    {invoice.status === 'sent' && (
                        <>
                            <Button variant="secondary" onClick={() => setIsCancelModalOpen(true)}>Cancel Invoice</Button>
                            <Button variant="secondary" onClick={() => setIsSendModalOpen(true)}>Resend Info</Button>
                            <Button variant="primary" onClick={() => setIsMarkPaidModalOpen(true)}>Mark as Paid</Button>
                        </>
                    )}
                    {invoice.status === 'overdue' && (
                        <>
                            <Button variant="secondary" onClick={() => setIsCancelModalOpen(true)}>Cancel Invoice</Button>
                            <Button variant="secondary" onClick={() => setIsSendModalOpen(true)}>Send Reminder</Button>
                            <Button variant="primary" onClick={() => setIsMarkPaidModalOpen(true)}>Mark as Paid</Button>
                        </>
                    )}
                    {invoice.status === 'paid' && (
                        <Button variant="secondary" onClick={() => console.log('View Receipt')}>View Receipt</Button>
                    )}
                    <Button variant="ghost" onClick={() => window.print()}>Print / PDF</Button>
                </div>
            </header>

            {/* Invoice Content */}
            <div className={styles.content}>
                {/* Top Info Grid */}
                <div className={styles.infoGrid}>
                    <div className={styles.infoSection}>
                        <h3 className={styles.label}>Customer</h3>
                        <div className={styles.customerInfo}>
                            <p className={styles.customerName}>{invoice.customer.name}</p>
                            <p>{invoice.customer.email}</p>
                            {invoice.customer.address_line_1 && <p>{invoice.customer.address_line_1}</p>}
                        </div>
                    </div>

                    <div className={styles.infoSection}>
                        <div className={styles.dateRow}>
                            <div>
                                <h3 className={styles.label}>Invoice Date</h3>
                                <p>{formatDate(invoice.invoice_date)}</p>
                            </div>
                            <div>
                                <h3 className={styles.label}>Due Date</h3>
                                <p>{formatDate(invoice.due_date)}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoSection}>
                        <h3 className={styles.label}>Amount Due</h3>
                        <p className={styles.totalAmount}>{formatCurrency(invoice.total)}</p>
                    </div>
                </div>

                {/* Line Items */}
                <div className={styles.itemsSection}>
                    <h2 className={styles.sectionTitle}>Items</h2>
                    <table className={styles.itemsTable}>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className={styles.textRight}>Qty</th>
                                <th className={styles.textRight}>Unit Price</th>
                                <th className={styles.textRight}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.description}</td>
                                    <td className={styles.textRight}>{item.quantity}</td>
                                    <td className={styles.textRight}>{formatCurrency(item.unit_price)}</td>
                                    <td className={styles.textRight}>{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className={styles.totalsSection}>
                    <div className={styles.totalRow}>
                        <span>Subtotal</span>
                        <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className={styles.totalRow}>
                        <span>Tax ({invoice.tax_rate}%)</span>
                        <span>{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                    <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                        <span>Total</span>
                        <span>{formatCurrency(invoice.total)}</span>
                    </div>
                </div>

                {/* Notes */}
                {(invoice.notes || invoice.internal_notes) && (
                    <div className={styles.notesSection}>
                        {invoice.notes && (
                            <div className={styles.noteBlock}>
                                <h3 className={styles.label}>Notes for Customer</h3>
                                <p>{invoice.notes}</p>
                            </div>
                        )}
                        {invoice.internal_notes && (
                            <div className={styles.noteBlock}>
                                <h3 className={styles.label}>Internal Notes</h3>
                                <p className={styles.internalNote}>{invoice.internal_notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
