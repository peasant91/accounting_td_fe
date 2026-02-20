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
import { PaymentMethod, MarkAsPaidData } from '@/types';

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
    const [paymentProof, setPaymentProof] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData: MarkAsPaidData = {
                payment_date: paymentDate,
                payment_method: paymentMethod as PaymentMethod,
                payment_reference: paymentReference,
                notes,
            };
            if (paymentProof) {
                submitData.payment_proof = paymentProof;
            }

            await markAsPaid.mutateAsync({
                id: invoiceId,
                data: submitData,
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentDate(e.target.value)}
                        required
                    />

                    <div className="space-y-2">
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <select
                            id="payment_method"
                            value={paymentMethod}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value as PaymentMethod)}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentReference(e.target.value)}
                        placeholder="e.g. TR-12345"
                    />

                    <div className="space-y-2">
                        <Label htmlFor="payment_proof">Proof of Payment (PDF, JPG, PNG)</Label>
                        <input
                            type="file"
                            id="payment_proof"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setPaymentProof(e.target.files[0]);
                                }
                            }}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
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
