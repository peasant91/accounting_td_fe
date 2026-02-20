'use client';

import { useParams } from 'next/navigation';
import { RecurringInvoiceForm } from '@/components/recurring/RecurringInvoiceForm';

export default function EditRecurringInvoicePage() {
    const params = useParams();
    const customerId = Number(params.id);
    const invoiceId = Number(params.invoiceId);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold">Edit Recurring Invoice</h1>
                <p className="text-muted-foreground">Update the recurring invoice schedule.</p>
            </header>
            <RecurringInvoiceForm id={invoiceId} customerId={customerId} />
        </div>
    );
}
