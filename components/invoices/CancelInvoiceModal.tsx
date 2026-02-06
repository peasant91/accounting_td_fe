'use client';

import styles from './InvoiceModals.module.css';
import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Cancel Invoice ${invoiceNumber}`}
            size="sm"
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <p>Are you sure you want to cancel this invoice? This action cannot be undone.</p>
                <div>
                    <label className={styles.label}>Cancellation Reason</label>
                    <textarea
                        className={styles.textarea}
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Why is this invoice being cancelled?"
                        required
                        rows={3}
                    />
                </div>
                <div className={styles.modalFooter}>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Keep Invoice
                    </Button>
                    <Button type="submit" variant="danger" loading={cancelInvoice.isPending}>
                        Cancel Invoice
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
