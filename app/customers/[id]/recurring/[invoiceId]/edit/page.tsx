'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { RecurringInvoiceForm } from '@/components/recurring/RecurringInvoiceForm';
import { useAuth } from '@/lib/auth';

export default function EditRecurringInvoicePage() {
    const params = useParams();
    const customerId = Number(params.id);
    const invoiceId = Number(params.invoiceId);
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user?.role === 'sales') {
            router.replace(`/customers/${customerId}`);
        }
    }, [user, isLoading, router, customerId]);

    if (isLoading || user?.role === 'sales') {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>;
    }

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
