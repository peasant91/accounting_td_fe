'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useInvoicePreview } from '@/lib/hooks/useInvoiceTemplates';
import { Loader2 } from 'lucide-react';
import { InvoicePrintView } from './InvoicePrintView';

interface InvoicePreviewModalProps {
    customerId: number;
    isOpen: boolean;
    onClose: () => void;
}

export function InvoicePreviewModal({ customerId, isOpen, onClose }: InvoicePreviewModalProps) {
    const { data, isLoading, error } = useInvoicePreview(customerId, isOpen);

    if (!isOpen) return null;

    const preview = data?.data;
    const sample = preview?.sample_invoice;
    const locale = preview?.locale;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
                <DialogHeader>
                    <DialogTitle>Invoice Preview</DialogTitle>
                    <DialogDescription>
                        Preview of the invoice based on current template settings ({locale?.language === 'ja' ? 'Japanese' : 'English'}).
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="p-4 text-red-500">Failed to load preview.</div>
                ) : sample && locale ? (
                    <div className="border border-gray-200 shadow-sm">
                        <InvoicePrintView
                            template={preview.template}
                            locale={preview.locale}
                            invoice={preview.sample_invoice}
                        />
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
