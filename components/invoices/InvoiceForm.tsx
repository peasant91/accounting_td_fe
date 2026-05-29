'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Autocomplete, Button, Input, Label, LoadingState, Switch, Textarea } from '@/components/ui';
import { useCustomers, useCreateInvoice, useUpdateInvoice, useInvoice, useLineItems } from '@/lib/hooks';
import { InvoiceFormData } from '@/types';
import { getTodayString, formatCurrency } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import * as itemTemplatesApi from '@/lib/api/item-templates';

interface InvoiceFormProps {
    invoiceId?: number;
}

type InvoiceFormState = Omit<InvoiceFormData, 'items'>;

export function InvoiceForm({ invoiceId }: InvoiceFormProps) {
    const router = useRouter();
    const { data: customersData } = useCustomers({});
    const createInvoice = useCreateInvoice();
    const updateInvoice = useUpdateInvoice();
    const { data: existingInvoiceData, isLoading: isLoadingInvoice } = useInvoice(invoiceId || 0);

    const isEditMode = !!invoiceId;

    const [formData, setFormData] = useState<InvoiceFormState>({
        customer_id: 0,
        invoice_date: getTodayString(),
        due_date: '',
        tax_rate: 0,
        notes: '',
        internal_notes: '',
        use_unique_code: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currency, setCurrency] = useState('IDR');
    const [templateSuggestions, setTemplateSuggestions] = useState<
        Array<string | { label: string; value: string }>
    >([]);

    const { items, setItems, updateItem, addItem, removeItem, subtotal, tax, total } = useLineItems({
        taxRate: formData.tax_rate,
    });

    const searchParams = useSearchParams();
    const autoSelectCustomerId = searchParams.get('customer_id');
    const existingInvoiceId = existingInvoiceData?.data?.id;
    const customers = customersData?.data;

    useEffect(() => {
        if (!isEditMode || !existingInvoiceData?.data) return;
        const invoice = existingInvoiceData.data;
        setFormData({
            customer_id: invoice.customer_id,
            invoice_date: invoice.invoice_date.split('T')[0],
            due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
            tax_rate: Number(invoice.tax_rate),
            notes: invoice.notes || '',
            internal_notes: invoice.internal_notes || '',
            use_unique_code: invoice.use_unique_code ?? false,
        });
        setCurrency(invoice.currency || 'IDR');
        setItems(
            invoice.items.map((item) => ({
                description: item.description,
                notes: item.notes ?? '',
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                amount: Number(item.quantity) * Number(item.unit_price),
            }))
        );
    }, [isEditMode, existingInvoiceId, existingInvoiceData, setItems]);

    useEffect(() => {
        if (isEditMode || !autoSelectCustomerId || formData.customer_id !== 0 || !customers) return;
        const customer = customers.find((c) => c.id === Number(autoSelectCustomerId));
        if (customer) {
            setFormData((prev) => ({ ...prev, customer_id: customer.id }));
            setCurrency(customer.currency || 'IDR');
        }
    }, [isEditMode, autoSelectCustomerId, formData.customer_id, customers]);

    useEffect(() => {
        itemTemplatesApi.list().then((res) => {
            setTemplateSuggestions(
                res.data.map((t) => ({
                    label: t.name,
                    value: t.description ?? t.name,
                }))
            );
        }).catch(() => {
            // fail silently — autocomplete is non-critical
        });
    }, []);

    const isSubmitting = createInvoice.isPending || updateInvoice.isPending;

    if (isEditMode && isLoadingInvoice) {
        return <LoadingState message="Loading invoice data..." />;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'customer_id' || name === 'tax_rate' ? Number(value) : value,
        }));

        if (name === 'customer_id') {
            const selectedCustomer = customers?.find((c) => c.id === Number(value));
            if (selectedCustomer) {
                setCurrency(selectedCustomer.currency || 'IDR');
            }
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.customer_id) {
            newErrors.customer_id = 'Please select a customer';
        }
        if (!formData.invoice_date) {
            newErrors.invoice_date = 'Invoice date is required';
        }
        if (items.length === 0 || items.every((item) => !item.description)) {
            newErrors.items = 'Please add at least one item';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const payload: InvoiceFormData = { ...formData, items };

        try {
            if (isEditMode && invoiceId) {
                await updateInvoice.mutateAsync({ id: invoiceId, data: payload });
                router.push(`/invoices/${invoiceId}`);
            } else {
                await createInvoice.mutateAsync(payload);
                router.push('/invoices');
            }
        } catch (error: unknown) {
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
                                {customers?.map((customer) => (
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
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                            <span className="col-span-5">Description</span>
                            <span className="col-span-2 text-right">Qty</span>
                            <span className="col-span-2 text-right">Unit Price</span>
                            <span className="col-span-2 text-right">Amount</span>
                            <span className="col-span-1"></span>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="space-y-2">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-5">
                                        <Autocomplete
                                            value={item.description}
                                            onChange={(value) => updateItem(index, 'description', value)}
                                            suggestions={templateSuggestions}
                                            placeholder="Item description"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            className="text-right"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="text-right"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                        />
                                    </div>
                                    <span className="col-span-2 text-right font-medium">
                                        {formatCurrency(item.quantity * item.unit_price, currency)}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length === 1}
                                        className="col-span-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-11">
                                        <Textarea
                                            rows={2}
                                            placeholder="Optional notes shown on the invoice"
                                            value={item.notes ?? ''}
                                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end border-t border-border pt-4">
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>{formatCurrency(subtotal, currency)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax ({formData.tax_rate}%):</span>
                                <span>{formatCurrency(tax, currency)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                                <span>Total:</span>
                                <span className="text-primary">{formatCurrency(total, currency)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Notes</h2>
                    <Textarea
                        label="Notes for Customer"
                        id="notes"
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        placeholder="Add any notes for the customer..."
                    />
                </div>

                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Payment Options</h2>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Switch
                                id="use-unique-code"
                                checked={formData.use_unique_code ?? false}
                                onCheckedChange={(checked) =>
                                    setFormData((prev) => ({ ...prev, use_unique_code: checked }))
                                }
                            />
                            <Label htmlFor="use-unique-code" className="cursor-pointer">
                                Include unique code for bank transfer
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-12">
                            Adds the last 3 digits of the invoice number to the displayed total for bank transfer identification.
                        </p>
                    </div>
                </div>

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
