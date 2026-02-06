'use client';

import { useRouter } from 'next/navigation';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCreateCustomer } from '@/lib/hooks';
import { CustomerFormData } from '@/types';

export default function NewCustomerPage() {
    const router = useRouter();
    const createCustomer = useCreateCustomer();

    const handleSubmit = async (data: CustomerFormData) => {
        const result = await createCustomer.mutateAsync(data);
        if (result?.data?.id) {
            router.push(`/customers/${result.data.id}`);
        } else {
            // Fallback redirect
            router.push('/customers');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-foreground">New Customer</h1>
                <p className="text-muted-foreground mt-1">Add a new customer to your database.</p>
            </header>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <CustomerForm
                    onSubmit={handleSubmit}
                    isLoading={createCustomer.isPending}
                    onCancel={() => router.back()}
                    submitLabel="Create Customer"
                />
            </div>
        </div>
    );
}
