'use client';

import { useParams } from 'next/navigation';
import { RecurringInvoiceForm } from '@/components/recurring/RecurringInvoiceForm';

export default function NewRecurringInvoicePage() {
    const params = useParams();
    const customerId = Number(params.id);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold">New Recurring Invoice</h1>
                <p className="text-muted-foreground">Create a new recurring invoice schedule for this customer.</p>
            </header>
            <RecurringInvoiceForm customerId={customerId} />
        </div>
    );
}
