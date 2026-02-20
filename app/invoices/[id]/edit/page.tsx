import { InvoiceForm } from '@/components/invoices';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// ... (keep interface)

export default async function EditInvoicePage(props: PageProps) {
    const params = await props.params;
    const invoiceId = parseInt(params.id, 10);

    if (isNaN(invoiceId)) {
        return <div>Invalid Invoice ID</div>;
    }

    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>}>
            <InvoiceForm invoiceId={invoiceId} />
        </Suspense>
    );
}
