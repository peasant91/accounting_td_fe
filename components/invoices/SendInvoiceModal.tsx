'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Label } from '@/components/ui';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Send Invoice {invoiceNumber}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            rows={6}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={sendInvoice.isPending}>
                            Send Invoice
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
