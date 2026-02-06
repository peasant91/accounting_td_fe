'use client';

import styles from './CustomerModal.module.css';
import { Modal } from '@/components/ui';
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
        // Map other fields if they exist in CustomerListItem or fetch detail if needed.
        // For list item editing, we might only have limited data unless we fetch.
        // Assuming CustomerListItem has enough or we accept partial updates.
        // NOTE: If CustomerListItem doesn't have address, tax_id etc, we might show empty fields or need to fetch.
        // For now, mapping what we have. Ideally "Edit" should fetch full details or pass full object.
        // Given previous file content, it seemed it was only setting name/email/phone from props.
    };

    const handleSubmit = async (data: CustomerFormData) => {
        await updateCustomer.mutateAsync({ id: customer.id, data });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Customer"
            footer={null} // Form has its own buttons
        >
            <CustomerForm
                initialData={initialData}
                onSubmit={handleSubmit}
                isLoading={updateCustomer.isPending}
                onCancel={onClose}
                submitLabel="Save Changes"
            />
        </Modal>
    );
}
