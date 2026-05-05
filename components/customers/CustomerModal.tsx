'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { LoadingState } from '@/components/ui';
import { useCustomer, useUpdateCustomer } from '@/lib/hooks';
import { CustomerFormData } from '@/types';
import { CustomerForm } from './CustomerForm';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: number | null;
}

export function CustomerModal({ isOpen, onClose, customerId }: CustomerModalProps) {
    const { data, isLoading } = useCustomer(customerId ?? 0);
    const updateCustomer = useUpdateCustomer();
    const customer = data?.data;

    const handleSubmit = async (formData: CustomerFormData) => {
        if (!customerId) return;
        await updateCustomer.mutateAsync({ id: customerId, data: formData });
        onClose();
    };

    const initialData: CustomerFormData | undefined = customer
        ? {
              name: customer.name,
              company_name: customer.company_name ?? '',
              email: customer.email,
              phone: customer.phone ?? '',
              currency: customer.currency,
              address_line_1: customer.address_line_1 ?? '',
              address_line_2: customer.address_line_2 ?? '',
              city: customer.city ?? '',
              state: customer.state ?? '',
              postal_code: customer.postal_code ?? '',
              country: customer.country ?? '',
              tax_id: customer.tax_id ?? '',
              notes: customer.notes ?? '',
          }
        : undefined;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                </DialogHeader>
                {isLoading || !initialData ? (
                    <LoadingState message="Loading customer..." className="min-h-[200px]" />
                ) : (
                    <CustomerForm
                        initialData={initialData}
                        onSubmit={handleSubmit}
                        isLoading={updateCustomer.isPending}
                        onCancel={onClose}
                        submitLabel="Save Changes"
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
