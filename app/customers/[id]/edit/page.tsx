'use client';

import { useParams, useRouter } from 'next/navigation';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCustomer, useUpdateCustomer } from '@/lib/hooks';
import { CustomerFormData } from '@/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function EditCustomerPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const { data, isLoading, error } = useCustomer(id);
    const updateCustomer = useUpdateCustomer();

    const customer = data?.data;

    const handleSubmit = async (formData: CustomerFormData) => {
        await updateCustomer.mutateAsync({ id, data: formData });
        router.push(`/customers/${id}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading customer details...</span>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
                <h3 className="text-lg font-semibold text-destructive">Error loading customer</h3>
                <p className="text-muted-foreground">The customer could not be found or an error occurred.</p>
                <Button onClick={() => router.push('/customers')} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Customers
                </Button>
            </div>
        );
    }

    const initialData: CustomerFormData = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        currency: customer.currency || 'IDR',
        company_name: customer.company_name || '',
        address_line_1: customer.address_line_1 || '',
        address_line_2: customer.address_line_2 || '',
        city: customer.city || '',
        state: customer.state || '',
        postal_code: customer.postal_code || '',
        country: customer.country || '',
        tax_id: customer.tax_id || '',
        notes: customer.notes || '',
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-foreground">Edit Customer</h1>
                <p className="text-muted-foreground mt-1">Update customer information.</p>
            </header>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <CustomerForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isLoading={updateCustomer.isPending}
                    onCancel={() => router.back()}
                    submitLabel="Update Customer"
                />
            </div>
        </div>
    );
}
