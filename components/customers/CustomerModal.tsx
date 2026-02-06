'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateCustomer } from '@/lib/hooks';
import { CustomerFormData, CustomerListItem } from '@/types';
import { CustomerForm } from './CustomerForm';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer?: CustomerListItem | null;
}

export function CustomerModal({ isOpen, onClose, customer }: CustomerModalProps) {
    const updateCustomer = useUpdateCustomer();

    if (!customer) return null;

    const initialData: CustomerFormData = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
    };

    const handleSubmit = async (data: CustomerFormData) => {
        await updateCustomer.mutateAsync({ id: customer.id, data });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                </DialogHeader>
                <CustomerForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isLoading={updateCustomer.isPending}
                    onCancel={onClose}
                    submitLabel="Save Changes"
                />
            </DialogContent>
        </Dialog>
    );
}
