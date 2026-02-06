'use client';

import { useRouter } from 'next/navigation';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCreateCustomer } from '@/lib/hooks';
import { CustomerFormData } from '@/types';
import styles from './page.module.css';

export default function NewCustomerPage() {
    const router = useRouter();
    const createCustomer = useCreateCustomer();

    const handleSubmit = async (data: CustomerFormData) => {
        const result = await createCustomer.mutateAsync(data);
        if (result?.data?.id) {
            router.push(`/customers/${result.data.id}`);
        } else {
            // Fallback redirect if ID is not immediately available, though it should be
            router.push('/customers');
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>New Customer</h1>
                <p className={styles.subtitle}>Add a new customer to your database.</p>
            </header>

            <div className={styles.card}>
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
