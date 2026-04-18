'use client';

import { useState } from 'react';
import { Button, Textarea } from '@/components/ui';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { useCancelInvoice } from '@/lib/hooks';

interface CancelInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: number;
    invoiceNumber: string;
}

export function CancelInvoiceModal({
    isOpen,
    onClose,
    invoiceId,
    invoiceNumber,
}: CancelInvoiceModalProps) {
    const cancelInvoice = useCancelInvoice();
    const [cancellationReason, setCancellationReason] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await cancelInvoice.mutateAsync({
                id: invoiceId,
                data: {
                    cancellation_reason: cancellationReason,
                },
            });
            onClose();
        } catch (error) {
            console.error('Failed to cancel invoice:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Cancel Invoice {invoiceNumber}</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel this invoice? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        label="Cancellation Reason"
                        id="cancellation_reason"
                        value={cancellationReason}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancellationReason(e.target.value)}
                        placeholder="Why is this invoice being cancelled?"
                        required
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Keep Invoice
                        </Button>
                        <Button type="submit" variant="destructive" loading={cancelInvoice.isPending}>
                            Cancel Invoice
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
