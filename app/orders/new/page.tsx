'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Label, Textarea, PriceInput } from '@/components/ui';
import { useCustomers, useCreateOrder, useInvoiceTypes } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { OrderFormData } from '@/types/order';
import { Loader2 } from 'lucide-react';

function NewOrderForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedCustomerId = searchParams.get('customer_id');

    const { user, isLoading: authLoading } = useAuth();
    const { data: customersData } = useCustomers({ per_page: 200 });
    const customers = customersData?.data ?? [];
    const { data: invoiceTypesData } = useInvoiceTypes();
    const invoiceTypes = invoiceTypesData?.data ?? [];
    const createOrder = useCreateOrder();

    const [formData, setFormData] = useState<Partial<OrderFormData>>({
        customer_id: preselectedCustomerId ? Number(preselectedCustomerId) : undefined,
        invoice_type_id: undefined,
        title: '',
        total_price: undefined,
        deposit_amount: null,
        maintenance_price: null,
        jp: null,
        source: null,
        sales_pic: null,
        date_of_contract: null,
        notes: null,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!authLoading && user?.role === 'sales') {
            router.replace('/orders');
        }
    }, [user, authLoading, router]);

    if (authLoading || user?.role === 'sales') {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numericFields = ['customer_id', 'invoice_type_id'];
        setFormData((prev) => ({
            ...prev,
            [name]: numericFields.includes(name) ? (value === '' ? null : Number(value)) : (value === '' ? null : value),
        }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.customer_id) newErrors.customer_id = 'Please select a customer';
        if (!formData.invoice_type_id) newErrors.invoice_type_id = 'Please select an invoice type';
        if (!formData.title?.trim()) newErrors.title = 'Title is required';
        if (!formData.total_price || formData.total_price <= 0) newErrors.total_price = 'Total price must be greater than 0';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const result = await createOrder.mutateAsync(formData as OrderFormData);
            router.push(`/orders/${result.data.id}`);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'errors' in err) {
                const apiErrors = (err as { errors: Record<string, string[]> }).errors;
                const newErrors: Record<string, string> = {};
                Object.keys(apiErrors).forEach((key) => {
                    newErrors[key] = apiErrors[key][0];
                });
                setErrors(newErrors);
            }
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-foreground">New Order</h1>
                <p className="text-muted-foreground mt-1">Create a new project order</p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-foreground">Order Details</h2>

                    <div className="space-y-2">
                        <Label htmlFor="customer_id">Customer *</Label>
                        <select
                            id="customer_id"
                            name="customer_id"
                            value={formData.customer_id ?? ''}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="">Select a customer...</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.company_name || c.name}
                                </option>
                            ))}
                        </select>
                        {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="invoice_type_id">Invoice Type *</Label>
                        <select
                            id="invoice_type_id"
                            name="invoice_type_id"
                            value={formData.invoice_type_id ?? ''}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="">Select type...</option>
                            {invoiceTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.code} — {t.name}
                                </option>
                            ))}
                        </select>
                        {errors.invoice_type_id && <p className="text-sm text-destructive">{errors.invoice_type_id}</p>}
                    </div>

                    <Input
                        label="Title *"
                        id="title"
                        name="title"
                        value={formData.title ?? ''}
                        onChange={handleChange}
                        placeholder="e.g. Website Development Project"
                        error={errors.title}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="total_price">Total Price *</Label>
                            <PriceInput
                                id="total_price"
                                value={formData.total_price}
                                onChange={(raw) => setFormData(prev => ({ ...prev, total_price: raw ? Number(raw) : undefined }))}
                            />
                            {errors.total_price && <p className="text-sm text-destructive">{errors.total_price}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deposit_amount">Deposit Amount</Label>
                            <PriceInput
                                id="deposit_amount"
                                value={formData.deposit_amount}
                                onChange={(raw) => setFormData(prev => ({ ...prev, deposit_amount: raw ? Number(raw) : null }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maintenance_price">Maintenance Price</Label>
                            <PriceInput
                                id="maintenance_price"
                                value={formData.maintenance_price}
                                onChange={(raw) => setFormData(prev => ({ ...prev, maintenance_price: raw ? Number(raw) : null }))}
                            />
                        </div>
                    </div>

                    <Input
                        label="Date of Contract"
                        id="date_of_contract"
                        name="date_of_contract"
                        type="date"
                        value={formData.date_of_contract ?? ''}
                        onChange={handleChange}
                    />
                </div>

                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Additional Info</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            label="JP"
                            id="jp"
                            name="jp"
                            value={formData.jp ?? ''}
                            onChange={handleChange}
                        />
                        <Input
                            label="Source"
                            id="source"
                            name="source"
                            value={formData.source ?? ''}
                            onChange={handleChange}
                        />
                        <Input
                            label="Sales PIC"
                            id="sales_pic"
                            name="sales_pic"
                            value={formData.sales_pic ?? ''}
                            onChange={handleChange}
                        />
                    </div>
                    <Textarea
                        label="Notes"
                        id="notes"
                        name="notes"
                        value={formData.notes ?? ''}
                        onChange={handleChange}
                        placeholder="Any additional notes..."
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={createOrder.isPending}>
                        Create Order
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default function NewOrderPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>}>
            <NewOrderForm />
        </Suspense>
    );
}
