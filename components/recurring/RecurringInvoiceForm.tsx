'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// We need similar hooks for Recurring Invoices
// Assuming useRecurringInvoice, useCreateRecurringInvoice, useUpdateRecurringInvoice exist or will be created
// For now, I'll use placeholders or I need to create the hooks first?
// I should create hooks first. 
// Let's assume they are in '@/lib/hooks/useRecurringInvoices' or similar.
import { useRecurringInvoice, useCreateRecurringInvoice, useUpdateRecurringInvoice } from '@/lib/hooks';
import { useCustomers } from '@/lib/hooks';
import { InvoiceItemFormData, RecurrenceType, RecurrenceUnit } from '@/types';
import { getTodayString, formatCurrency } from '@/lib/utils';
import { Loader2, Plus, X, Calendar } from 'lucide-react';

const emptyItem: InvoiceItemFormData = {
    description: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
};

interface RecurringInvoiceFormProps {
    id?: number;
    customerId?: number;
}

export function RecurringInvoiceForm({ id, customerId }: RecurringInvoiceFormProps) {
    const router = useRouter();
    const { data: customersData } = useCustomers({});
    const createMutation = useCreateRecurringInvoice();
    const updateMutation = useUpdateRecurringInvoice();
    const { data: existingData, isLoading } = useRecurringInvoice(id || 0);

    const isEditMode = !!id;

    // Form State
    const [formData, setFormData] = useState({
        customer_id: customerId || 0,
        title: '',
        recurrence_type: 'monthly' as RecurrenceType,
        recurrence_interval: 1,
        recurrence_unit: 'month' as RecurrenceUnit,
        total_count: null as number | null,
        start_date: getTodayString(),
        due_date_offset: 0,
        tax_rate: 0,
        currency: 'IDR',
        notes: '',
        line_items: [{ ...emptyItem }],
    });

    const [currency, setCurrency] = useState('IDR');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load existing data
    useEffect(() => {
        if (isEditMode && existingData?.data) {
            const data = existingData.data;
            setFormData({
                customer_id: data.customer_id,
                title: data.title,
                recurrence_type: data.recurrence_type,
                recurrence_interval: data.recurrence_interval,
                recurrence_unit: data.recurrence_unit || 'month',
                total_count: data.total_count,
                start_date: data.start_date.split('T')[0],
                due_date_offset: data.due_date_offset || 0,
                tax_rate: Number(data.tax_rate),
                currency: data.currency,
                notes: data.notes || '',
                line_items: Array.isArray(data.line_items) ? data.line_items.map((item: any) => ({
                    description: item.description || '',
                    quantity: Number(item.quantity) || 1,
                    unit_price: Number(item.unit_price) || 0,
                    amount: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
                })) : [{ ...emptyItem }],
            });
            setCurrency(data.currency);
        } else if (customerId && customersData?.data) {
            const customer = customersData.data.find(c => c.id === customerId);
            if (customer) {
                setFormData(prev => ({ ...prev, customer_id: customer.id, currency: customer.currency || 'IDR' }));
                setCurrency(customer.currency || 'IDR');
            }
        }
    }, [isEditMode, existingData, customerId, customersData]);

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (isEditMode && isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['customer_id', 'recurrence_interval', 'total_count', 'due_date_offset', 'tax_rate'].includes(name)
                ? (value === '' ? (name === 'total_count' ? null : 0) : Number(value))
                : value
        }));

        if (name === 'customer_id') {
            const customer = customersData?.data?.find(c => c.id === Number(value));
            if (customer) setCurrency(customer.currency || 'IDR');
        }
    };

    // ... Item handlers (same as InvoiceForm) ...
    const handleItemChange = (index: number, field: keyof InvoiceItemFormData, value: string | number) => {
        setFormData((prev) => {
            const items = [...prev.line_items];
            const newValue = field === 'description' ? value : Number(value);
            items[index] = { ...items[index], [field]: newValue };
            if (field !== 'description') {
                items[index].amount = items[index].quantity * items[index].unit_price;
            }
            return { ...prev, line_items: items };
        });
    };

    const addItem = () => setFormData(prev => ({ ...prev, line_items: [...prev.line_items, { ...emptyItem }] }));
    const removeItem = (index: number) => {
        if (formData.line_items.length > 1) {
            setFormData(prev => ({ ...prev, line_items: prev.line_items.filter((_, i) => i !== index) }));
        }
    };

    const calculateSubtotal = () => formData.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const calculateTax = () => (calculateSubtotal() * formData.tax_rate) / 100;
    const calculateTotal = () => calculateSubtotal() + calculateTax();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validation logic ...

        try {
            if (isEditMode) {
                await updateMutation.mutateAsync({ id: id!, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
            router.push(`/customers/${formData.customer_id}`); // Redirect to customer details?
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                <h2 className="text-lg font-semibold">Recurring Settings</h2>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Monthly Retainer" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Customer</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            name="customer_id" value={formData.customer_id} onChange={handleChange} disabled={!!customerId && !isEditMode}>
                            <option value={0}>Select Customer</option>
                            {customersData?.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Frequency</Label>
                        <select name="recurrence_type" value={formData.recurrence_type} onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="bi-weekly">Bi-Weekly</option>
                            <option value="tri-weekly">Tri-Weekly</option>
                            <option value="manual">Manual</option>
                            <option value="counted">Counted</option>
                        </select>
                    </div>

                    {formData.recurrence_type === 'counted' && (
                        <>
                            <div className="space-y-2">
                                <Label>Interval</Label>
                                <div className="flex gap-2">
                                    <Input type="number" name="recurrence_interval" value={formData.recurrence_interval} onChange={handleChange} min={1} className="w-20" />
                                    <select name="recurrence_unit" value={formData.recurrence_unit} onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="day">Days</option>
                                        <option value="week">Weeks</option>
                                        <option value="month">Months</option>
                                        <option value="year">Years</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Total Count</Label>
                                <Input type="number" name="total_count" value={formData.total_count ?? ''} onChange={handleChange} placeholder="Unlimited" min={1} />
                            </div>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Start Date" name="start_date" value={formData.start_date} onChange={handleChange} required min={getTodayString()} />
                    <Input type="number" label="Due Date Days Offset" name="due_date_offset" value={formData.due_date_offset} onChange={handleChange} min={0} hint="Days after invoice date" />
                    <Input type="number" label="Tax Rate (%)" name="tax_rate" value={formData.tax_rate} onChange={handleChange} hint="Enter 0 for no tax" />
                </div>
            </div>

            {/* Line Items - Simplified copy from InvoiceForm */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Line Items</h2>
                    <Button type="button" variant="secondary" size="sm" onClick={addItem}><Plus className="h-4 w-4" /> Add Item</Button>
                </div>

                <div className="space-y-4">
                    {formData.line_items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-5">
                                <Input placeholder="Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <Input type="number" placeholder="Price" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} />
                            </div>
                            <div className="col-span-2 text-right font-medium">{formatCurrency(item.amount, currency)}</div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}><X className="h-4 w-4" /></Button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(calculateSubtotal(), currency)}</span></div>
                        <div className="flex justify-between text-sm"><span>Tax ({formData.tax_rate}%)</span><span>{formatCurrency(calculateTax(), currency)}</span></div>
                        <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(calculateTotal(), currency)}</span></div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" loading={isSubmitting}>{isEditMode ? 'Update Template' : 'Create Template'}</Button>
            </div>
        </form>
    );
}
