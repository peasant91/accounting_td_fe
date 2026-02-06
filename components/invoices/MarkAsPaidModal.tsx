'use client';

import styles from './InvoiceModals.module.css';
import { useState } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { useMarkAsPaid } from '@/lib/hooks';
import { getTodayString } from '@/lib/utils';
import { PaymentMethod } from '@/types';

interface MarkAsPaidModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: number;
    invoiceNumber: string;
    totalAmount: number;
}

export function MarkAsPaidModal({
    isOpen,
    onClose,
    invoiceId,
    invoiceNumber,
    totalAmount,
}: MarkAsPaidModalProps) {
    const markAsPaid = useMarkAsPaid();
    const [paymentDate, setPaymentDate] = useState(getTodayString());
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
    const [paymentReference, setPaymentReference] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await markAsPaid.mutateAsync({
                id: invoiceId,
                data: {
                    payment_date: paymentDate,
                    payment_method: paymentMethod as PaymentMethod,
                    payment_reference: paymentReference,
                    notes,
                },
            });
            onClose();
        } catch (error) {
            console.error('Failed to mark as paid:', error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Mark Invoice ${invoiceNumber} as Paid`}
            size="md"
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <p>Total Amount Due: <strong>${totalAmount.toFixed(2)}</strong></p>

                <Input
                    label="Payment Date"
                    name="payment_date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                />

                <div>
                    <label className={styles.label}>Payment Method</label>
                    <select
                        className={styles.textarea}
                        style={{ height: 'auto', padding: '10px' }}
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    >
                        <option value="">Select Method</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cash">Cash</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <Input
                    label="Reference / Transaction ID"
                    name="payment_reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. TR-12345"
                />

                <div>
                    <label className={styles.label}>Notes</label>
                    <textarea
                        className={styles.textarea}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional payment notes..."
                        rows={3}
                    />
                </div>

                <div className={styles.modalFooter}>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={markAsPaid.isPending}>
                        Confirm Payment
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
