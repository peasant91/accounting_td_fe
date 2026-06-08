'use client';

import { InvoiceForm } from '@/components/invoices';
import { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter, useParams } from 'next/navigation';

export default function EditInvoicePage() {
    const params = useParams();
    const invoiceId = parseInt(params.id as string, 10);
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user?.role === 'sales') {
            router.replace('/invoices');
        }
    }, [user, isLoading, router]);

    if (isNaN(invoiceId)) {
        return <div>Invalid Invoice ID</div>;
    }

    if (isLoading || user?.role === 'sales') {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>;
    }

    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>}>
            <InvoiceForm invoiceId={invoiceId} />
        </Suspense>
    );
}
