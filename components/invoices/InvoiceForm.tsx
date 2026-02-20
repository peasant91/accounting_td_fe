'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Label } from '@/components/ui';
import { useCustomers, useCreateInvoice, useUpdateInvoice, useInvoice } from '@/lib/hooks';
import { InvoiceFormData, InvoiceItemFormData } from '@/types';
import { getTodayString, formatCurrency } from '@/lib/utils';
import { Loader2, Plus, X } from 'lucide-react';

const emptyItem: InvoiceItemFormData = {
    description: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
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

    const [currency, setCurrency] = useState('IDR');

    const searchParams = useSearchParams();
    const autoSelectCustomerId = searchParams.get('customer_id');

    useEffect(() => {
        if (isEditMode && existingInvoiceData?.data) {
            const invoice = existingInvoiceData.data;
            // Only update if the invoice data has actually changed or hasn't been loaded yet
            if (formData.customer_id === 0) {
                setFormData({
                    customer_id: invoice.customer_id,
                    invoice_date: invoice.invoice_date.split('T')[0],
                    due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
                    tax_rate: Number(invoice.tax_rate),
                    notes: invoice.notes || '',
                    internal_notes: invoice.internal_notes || '',
                    items: invoice.items.map((item) => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                        amount: Number(item.quantity) * Number(item.unit_price),
                    })),
                });
                setCurrency(invoice.currency || 'IDR');
            }
        } else if (!isEditMode && autoSelectCustomerId && formData.customer_id === 0 && customersData?.data) {
            // Auto-select customer from URL params
            const customerId = Number(autoSelectCustomerId);
            const customer = customersData.data.find(c => c.id === customerId);

            if (customer) {
                setFormData(prev => ({ ...prev, customer_id: customerId }));
                setCurrency(customer.currency || 'IDR');
            }
        }
    }, [isEditMode, existingInvoiceData, formData.customer_id, autoSelectCustomerId, customersData]);

    const customers = customersData?.data || [];
    const isSubmitting = createInvoice.isPending || updateInvoice.isPending;

    if (isEditMode && isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading invoice data...</span>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'customer_id' || name === 'tax_rate' ? Number(value) : value,
        }));

        if (name === 'customer_id') {
            const selectedCustomer = customers.find(c => c.id === Number(value));
            if (selectedCustomer) {
                setCurrency(selectedCustomer.currency || 'IDR');
            }
        }
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
        } catch (error: unknown) {
            console.error('Failed to save invoice:', error);
            if (error && typeof error === 'object' && 'errors' in error) {
                const apiErrors = (error as { errors: Record<string, string[]> }).errors;
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
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-foreground">{isEditMode ? 'Edit Invoice' : 'Create Invoice'}</h1>
                <p className="text-muted-foreground mt-1">
                    {isEditMode ? 'Update invoice details' : 'Create a new invoice for your customer'}
                </p>
            </header>

            <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Invoice Details Section */}
                <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-foreground">Invoice Details</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_id">Customer *</Label>
                            <select
                                id="customer_id"
                                name="customer_id"
                                value={formData.customer_id}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value={0}>Select a customer</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                            {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                                value={formData.due_date || ''}
                                onChange={handleChange}
                                error={errors.due_date}
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

                {/* Line Items Section */}
                <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Line Items</h2>
                        <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                            <Plus className="h-4 w-4" />
                            Add Item
                        </Button>
                    </div>
                    {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}

                    <div className="space-y-4">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                            <span className="col-span-5">Description</span>
                            <span className="col-span-2 text-right">Qty</span>
                            <span className="col-span-2 text-right">Unit Price</span>
                            <span className="col-span-2 text-right">Amount</span>
                            <span className="col-span-1"></span>
                        </div>

                        {/* Items */}
                        {formData.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                <input
                                    type="text"
                                    placeholder="Item description"
                                    value={item.description}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'description', e.target.value)}
                                    className="col-span-5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'quantity', e.target.value)}
                                    className="col-span-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unit_price}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'unit_price', e.target.value)}
                                    className="col-span-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <span className="col-span-2 text-right font-medium">
                                    {formatCurrency(item.quantity * item.unit_price, currency)}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(index)}
                                    disabled={formData.items.length === 1}
                                    className="col-span-1"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end border-t border-border pt-4">
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>{formatCurrency(calculateSubtotal(), currency)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax ({formData.tax_rate}%):</span>
                                <span>{formatCurrency(calculateTax(), currency)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                                <span>Total:</span>
                                <span className="text-primary">{formatCurrency(calculateTotal(), currency)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Notes</h2>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes for Customer</Label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes || ''}
                            onChange={handleChange}
                            placeholder="Add any notes for the customer..."
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
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
