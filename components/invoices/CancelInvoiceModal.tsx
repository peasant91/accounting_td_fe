'use client';

import { useState } from 'react';
import { Button, Label } from '@/components/ui';
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
                    <div className="space-y-2">
                        <Label htmlFor="cancellation_reason">Cancellation Reason</Label>
                        <textarea
                            id="cancellation_reason"
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Why is this invoice being cancelled?"
                            required
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
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
