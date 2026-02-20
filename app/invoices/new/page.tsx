import { InvoiceForm } from '@/components/invoices';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function NewInvoicePage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>}>
            <InvoiceForm />
        </Suspense>
    );
}
