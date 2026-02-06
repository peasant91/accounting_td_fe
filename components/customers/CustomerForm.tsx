'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { CustomerFormData } from '@/types';
import styles from './CustomerList.module.css'; // Reusing list module styles for now or could reuse modal styles if suitable

interface CustomerFormProps {
    initialData?: CustomerFormData;
    onSubmit: (data: CustomerFormData) => Promise<void>;
    isLoading: boolean;
    onCancel?: () => void;
    submitLabel?: string;
}

const initialFormData: CustomerFormData = {
    name: '',
    email: '',
    phone: '',
    address_line_1: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    tax_id: '',
    notes: '',
};

export function CustomerForm({ initialData, onSubmit, isLoading, onCancel, submitLabel = 'Save' }: CustomerFormProps) {
    const [formData, setFormData] = useState<CustomerFormData>(initialData || initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            await onSubmit(formData);
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'errors' in error) {
                const apiErrors = error as { errors: Record<string, string[]> };
                const fieldErrors: Record<string, string> = {};
                for (const [field, messages] of Object.entries(apiErrors.errors)) {
                    fieldErrors[field] = messages[0];
                }
                setErrors(fieldErrors);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            <div className={styles.formGrid}>
                <Input
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                />
                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                />
                <Input
                    label="Phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                />
                <Input
                    label="Address"
                    name="address_line_1"
                    value={formData.address_line_1 || ''}
                    onChange={handleChange}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                        label="City"
                        name="city"
                        value={formData.city || ''}
                        onChange={handleChange}
                    />
                    <Input
                        label="State"
                        name="state"
                        value={formData.state || ''}
                        onChange={handleChange}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                        label="Postal Code"
                        name="postal_code"
                        value={formData.postal_code || ''}
                        onChange={handleChange}
                    />
                    <Input
                        label="Country"
                        name="country"
                        value={formData.country || ''}
                        onChange={handleChange}
                    />
                </div>
                <Input
                    label="Tax ID"
                    name="tax_id"
                    value={formData.tax_id || ''}
                    onChange={handleChange}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Notes</label>
                    <textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        className={styles.textarea} // Assuming styles exist or will be added
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" loading={isLoading}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
