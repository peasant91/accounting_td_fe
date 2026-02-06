import { InvoiceDetail } from '@/components/invoices';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function InvoiceDetailPage(props: PageProps) {
    const params = await props.params;
    const invoiceId = parseInt(params.id, 10);

    if (isNaN(invoiceId)) {
        return <div>Invalid Invoice ID</div>;
    }

    return <InvoiceDetail invoiceId={invoiceId} />;
}
