'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { CustomerFormData } from '@/types';

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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
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
