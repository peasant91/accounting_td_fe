'use client';

import styles from './InvoiceForm.module.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { useCustomers, useCreateInvoice, useUpdateInvoice, useInvoice } from '@/lib/hooks';
import { InvoiceFormData, InvoiceItemFormData } from '@/types';
import { getTodayString } from '@/lib/utils';

const emptyItem: InvoiceItemFormData = {
    description: '',
    quantity: 1,
    unit_price: 0,
};

interface InvoiceFormProps {
    invoiceId?: number;
}

export function InvoiceForm({ invoiceId }: InvoiceFormProps) {
    const router = useRouter();
    const { data: customersData } = useCustomers({});
    const createInvoice = useCreateInvoice();
    const updateInvoice = useUpdateInvoice();
    const { data: existingInvoiceData, isLoading: isLoadingInvoice } = useInvoice(invoiceId || 0);

    const isEditMode = !!invoiceId;

    const [formData, setFormData] = useState<InvoiceFormData>({
        customer_id: 0,
        invoice_date: getTodayString(),
        due_date: '',
        tax_rate: 0,
        notes: '',
        internal_notes: '',
        items: [{ ...emptyItem }],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isEditMode && existingInvoiceData?.data) {
            const invoice = existingInvoiceData.data;
            setFormData({
                customer_id: invoice.customer_id,
                invoice_date: invoice.invoice_date.split('T')[0],
                due_date: invoice.due_date.split('T')[0],
                tax_rate: Number(invoice.tax_rate),
                notes: invoice.notes || '',
                internal_notes: invoice.internal_notes || '',
                items: invoice.items.map((item) => ({
                    description: item.description,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                })),
            });
        }
    }, [isEditMode, existingInvoiceData]);

    const customers = customersData?.data || [];
    const isSubmitting = createInvoice.isPending || updateInvoice.isPending;

    if (isEditMode && isLoadingInvoice) {
        return <div className={styles.loading}>Loading invoice data...</div>;
    }


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'customer_id' || name === 'tax_rate' ? Number(value) : value,
        }));
    };

    const handleItemChange = (index: number, field: keyof InvoiceItemFormData, value: string | number) => {
        setFormData((prev) => {
            const items = [...prev.items];
            items[index] = {
                ...items[index],
                [field]: field === 'description' ? value : Number(value),
            };
            return { ...prev, items };
        });
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { ...emptyItem }],
        }));
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            setFormData((prev) => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index),
            }));
        }
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    };

    const calculateTax = () => {
        return (calculateSubtotal() * formData.tax_rate) / 100;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.customer_id) {
            newErrors.customer_id = 'Please select a customer';
        }
        if (!formData.invoice_date) {
            newErrors.invoice_date = 'Invoice date is required';
        }
        if (!formData.due_date) {
            newErrors.due_date = 'Due date is required';
        }
        if (formData.items.length === 0 || formData.items.every((item) => !item.description)) {
            newErrors.items = 'Please add at least one item';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            if (isEditMode && invoiceId) {
                await updateInvoice.mutateAsync({ id: invoiceId, data: formData });
                router.push(`/invoices/${invoiceId}`);
            } else {
                await createInvoice.mutateAsync(formData);
                router.push('/invoices');
            }
        } catch (error: any) {
            console.error('Failed to save invoice:', error);
            if (error?.errors) {
                const apiErrors = error.errors as Record<string, string[]>;
                const newErrors: Record<string, string> = {};

                Object.keys(apiErrors).forEach((key) => {
                    const message = apiErrors[key][0];
                    if (key.startsWith('items.')) {
                        newErrors.items = message;
                    } else {
                        newErrors[key] = message;
                    }
                });

                setErrors(newErrors);
            }
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>{isEditMode ? 'Edit Invoice' : 'Create Invoice'}</h1>
                <p className={styles.subtitle}>
                    {isEditMode ? 'Update invoice details' : 'Create a new invoice for your customer'}
                </p>
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
                {/* ... existing form content ... */}
                {/* ... existing form content ... */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Invoice Details</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Customer *</label>
                            <select
                                name="customer_id"
                                value={formData.customer_id}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value={0}>Select a customer</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                            {errors.customer_id && <span className={styles.error}>{errors.customer_id}</span>}
                        </div>

                        <div className={styles.row}>
                            <Input
                                label="Invoice Date"
                                name="invoice_date"
                                type="date"
                                value={formData.invoice_date}
                                onChange={handleChange}
                                error={errors.invoice_date}
                                required
                            />
                            <Input
                                label="Due Date"
                                name="due_date"
                                type="date"
                                value={formData.due_date}
                                onChange={handleChange}
                                error={errors.due_date}
                                required
                            />
                        </div>

                        <Input
                            label="Tax Rate (%)"
                            name="tax_rate"
                            type="number"
                            value={formData.tax_rate}
                            onChange={handleChange}
                            hint="Enter 0 for no tax"
                        />
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Line Items</h2>
                        <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                            + Add Item
                        </Button>
                    </div>
                    {errors.items && <span className={styles.error}>{errors.items}</span>}

                    <div className={styles.itemsTable}>
                        <div className={styles.itemsHeader}>
                            <span>Description</span>
                            <span>Qty</span>
                            <span>Unit Price</span>
                            <span>Amount</span>
                            <span></span>
                        </div>
                        {formData.items.map((item, index) => (
                            <div key={index} className={styles.itemRow}>
                                <input
                                    type="text"
                                    placeholder="Item description"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    className={styles.itemInput}
                                />
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    className={styles.itemInputSmall}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unit_price}
                                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                    className={styles.itemInputSmall}
                                />
                                <span className={styles.itemAmount}>
                                    ${(item.quantity * item.unit_price).toFixed(2)}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                    disabled={formData.items.length === 1}
                                >
                                    ✕
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className={styles.totals}>
                        <div className={styles.totalRow}>
                            <span>Subtotal:</span>
                            <span>${calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span>Tax ({formData.tax_rate}%):</span>
                            <span>${calculateTax().toFixed(2)}</span>
                        </div>
                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                            <span>Total:</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Notes</h2>
                    <textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        placeholder="Add any notes for the customer..."
                        className={styles.textarea}
                        rows={3}
                    />
                </div>

                <div className={styles.actions}>
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={isSubmitting}>
                        {isEditMode ? 'Update Invoice' : 'Create Invoice'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
