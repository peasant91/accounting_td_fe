'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useMarkAsPaid } from '@/lib/hooks';
import { getTodayString, formatCurrency } from '@/lib/utils';
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Mark Invoice {invoiceNumber} as Paid</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Total Amount Due: <strong className="text-foreground">{formatCurrency(totalAmount)}</strong>
                    </p>

                    <Input
                        label="Payment Date"
                        name="payment_date"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        required
                    />

                    <div className="space-y-2">
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <select
                            id="payment_method"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional payment notes..."
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={markAsPaid.isPending}>
                            Confirm Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
