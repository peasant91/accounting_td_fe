'use client';

import styles from './InvoiceModals.module.css';
import { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { useSendInvoice } from '@/lib/hooks';

interface SendInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: number;
    invoiceNumber: string;
    customerEmail: string;
}

export function SendInvoiceModal({
    isOpen,
    onClose,
    invoiceId,
    invoiceNumber,
    customerEmail,
}: SendInvoiceModalProps) {
    const sendInvoice = useSendInvoice();
    const [recipientEmail, setRecipientEmail] = useState(customerEmail);
    const [subject, setSubject] = useState(`Invoice ${invoiceNumber} from Timedoor`);
    const [message, setMessage] = useState(
        `Dear Customer,\n\nPlease find attached the invoice ${invoiceNumber} for your recent purchase.\n\nThank you for your business.\n\nBest regards,\nTimedoor Team`
    );

    useEffect(() => {
        if (isOpen) {
            setRecipientEmail(customerEmail);
            setSubject(`Invoice ${invoiceNumber} from Timedoor`);
            setMessage(`Dear Customer,\n\nPlease find attached the invoice ${invoiceNumber} for your recent purchase.\n\nThank you for your business.\n\nBest regards,\nTimedoor Team`);
        }
    }, [isOpen, customerEmail, invoiceNumber]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendInvoice.mutateAsync({
                id: invoiceId,
                data: {
                    recipient_email: recipientEmail,
                    subject,
                    message,
                },
            });
            onClose();
        } catch (error) {
            console.error('Failed to send invoice:', error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Send Invoice ${invoiceNumber}`}
            size="md"
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <Input
                    label="To"
                    name="recipient_email"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                />
                <Input
                    label="Subject"
                    name="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                />
                <div>
                    <label className={styles.label}>Message</label>
                    <textarea
                        className={styles.textarea}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.modalFooter}>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={sendInvoice.isPending}>
                        Send Invoice
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
