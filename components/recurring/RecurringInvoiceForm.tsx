'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, LoadingState, Switch, Textarea } from '@/components/ui';
import {
    useRecurringInvoice,
    useCreateRecurringInvoice,
    useUpdateRecurringInvoice,
    useCustomers,
    useLineItems,
} from '@/lib/hooks';
import { InvoiceItemFormData, RecurrenceType, RecurrenceUnit } from '@/types';
import { getTodayString, formatCurrency } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface RecurringInvoiceFormProps {
    id?: number;
    customerId?: number;
}

interface RecurringFormState {
    customer_id: number;
    title: string;
    recurrence_type: RecurrenceType;
    recurrence_interval: number;
    recurrence_unit: RecurrenceUnit;
    total_count: number | null;
    start_date: string;
    due_date_offset: number;
    tax_rate: number;
    currency: string;
    external_notes: string;
    use_unique_code: boolean;
}

export function RecurringInvoiceForm({ id, customerId }: RecurringInvoiceFormProps) {
    const router = useRouter();
    const { data: customersData } = useCustomers({});
    const createMutation = useCreateRecurringInvoice();
    const updateMutation = useUpdateRecurringInvoice();
    const { data: existingData, isLoading } = useRecurringInvoice(id || 0);

    const isEditMode = !!id;

    const [formData, setFormData] = useState<RecurringFormState>({
        customer_id: customerId || 0,
        title: '',
        recurrence_type: 'monthly',
        recurrence_interval: 1,
        recurrence_unit: 'month',
        total_count: null,
        start_date: getTodayString(),
        due_date_offset: 0,
        tax_rate: 0,
        currency: 'IDR',
        external_notes: '',
        use_unique_code: false,
    });

    const { items, setItems, updateItem, addItem, removeItem, subtotal, tax, total } = useLineItems({
        taxRate: formData.tax_rate,
    });

    const existingId = existingData?.data?.id;
    const customers = customersData?.data;

    useEffect(() => {
        if (!isEditMode || !existingData?.data) return;
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
            external_notes: data.external_notes || '',
            use_unique_code: data.use_unique_code ?? false,
        });
        setItems(
            Array.isArray(data.line_items)
                ? data.line_items.map((item: InvoiceItemFormData) => ({
                      description: item.description || '',
                      notes: item.notes ?? '',
                      quantity: Number(item.quantity) || 1,
                      unit_price: Number(item.unit_price) || 0,
                      amount: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
                  }))
                : []
        );
    }, [isEditMode, existingId, existingData, setItems]);

    useEffect(() => {
        if (isEditMode || !customerId || !customers) return;
        const customer = customers.find((c) => c.id === customerId);
        if (customer) {
            setFormData((prev) => ({
                ...prev,
                customer_id: customer.id,
                currency: customer.currency || 'IDR',
            }));
        }
    }, [isEditMode, customerId, customers]);

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (isEditMode && isLoading) {
        return <LoadingState />;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numericFields = ['customer_id', 'recurrence_interval', 'total_count', 'due_date_offset', 'tax_rate'];
        setFormData((prev) => ({
            ...prev,
            [name]: numericFields.includes(name)
                ? value === ''
                    ? name === 'total_count'
                        ? null
                        : 0
                    : Number(value)
                : value,
        }));

        if (name === 'customer_id') {
            const customer = customers?.find((c) => c.id === Number(value));
            if (customer) {
                setFormData((prev) => ({ ...prev, currency: customer.currency || 'IDR' }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = { ...formData, line_items: items };

        try {
            if (isEditMode) {
                await updateMutation.mutateAsync({ id: id!, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            router.push(`/customers/${formData.customer_id}`);
        } catch (error) {
            console.error(error);
        }
    };

    const currency = formData.currency;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                <h2 className="text-lg font-semibold">Recurring Settings</h2>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Monthly Retainer"
                        required
                    />
                    <div className="space-y-2">
                        <Label>Customer</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            name="customer_id"
                            value={formData.customer_id}
                            onChange={handleChange}
                            disabled={!!customerId && !isEditMode}
                        >
                            <option value={0}>Select Customer</option>
                            {customers?.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Frequency</Label>
                        <select
                            name="recurrence_type"
                            value={formData.recurrence_type}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
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
                                    <Input
                                        type="number"
                                        name="recurrence_interval"
                                        value={formData.recurrence_interval}
                                        onChange={handleChange}
                                        min={1}
                                        className="w-20"
                                    />
                                    <select
                                        name="recurrence_unit"
                                        value={formData.recurrence_unit}
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="day">Days</option>
                                        <option value="week">Weeks</option>
                                        <option value="month">Months</option>
                                        <option value="year">Years</option>
                                    </select>
                                </div>
                            </div>
                            <Input
                                label="Total Count"
                                type="number"
                                name="total_count"
                                value={formData.total_count ?? ''}
                                onChange={handleChange}
                                placeholder="Unlimited"
                                min={1}
                            />
                        </>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        type="date"
                        label="Start Date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                        min={getTodayString()}
                    />
                    <Input
                        type="number"
                        label="Due Date Days Offset"
                        name="due_date_offset"
                        value={formData.due_date_offset}
                        onChange={handleChange}
                        min={0}
                        hint="Days after invoice date"
                    />
                    <Input
                        type="number"
                        label="Tax Rate (%)"
                        name="tax_rate"
                        value={formData.tax_rate}
                        onChange={handleChange}
                        hint="Enter 0 for no tax"
                    />
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Line Items</h2>
                    <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4" /> Add Item
                    </Button>
                </div>

                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="space-y-2">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-5">
                                    <Input
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        placeholder="Price"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 text-right font-medium">
                                    {formatCurrency(item.amount, currency)}
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
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

                <div className="flex justify-end pt-4 border-t">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal, currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Tax ({formData.tax_rate}%)</span>
                            <span>{formatCurrency(tax, currency)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>{formatCurrency(total, currency)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold">Payment Options</h2>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Switch
                            id="use-unique-code"
                            checked={formData.use_unique_code}
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

            <div className="bg-card rounded-lg border border-border p-6">
                <Textarea
                    label="Notes"
                    name="external_notes"
                    value={formData.external_notes}
                    onChange={handleChange}
                    placeholder="Optional notes…"
                />
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                    {isEditMode ? 'Update Template' : 'Create Template'}
                </Button>
            </div>
        </form>
    );
}
