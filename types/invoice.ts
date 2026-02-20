// Invoice types

import { Customer } from './customer';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'other';
export type InvoiceType = 'manual' | 'recurring';
export type RecurrenceType = 'monthly' | 'weekly' | 'bi-weekly' | 'tri-weekly' | 'manual' | 'counted';
export type RecurrenceUnit = 'day' | 'week' | 'month' | 'year';

export interface RecurringInvoice {
    id: number;
    customer_id: number;
    title: string;
    recurrence_type: RecurrenceType;
    recurrence_interval: number;
    recurrence_unit: RecurrenceUnit | null;
    total_count: number | null;
    generated_count: number;
    start_date: string;
    next_invoice_date: string | null;
    status: 'active' | 'pending' | 'completed' | 'terminated';
    line_items: InvoiceItemFormData[];
    tax_rate: number;
    currency: string;
    due_date_offset: number;
    notes: string | null;
    last_generated_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvoiceItem {
    id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface Invoice {
    id: number;
    invoice_number: string;
    customer_id: number;
    customer: Customer;
    currency: string;
    invoice_date: string;
    due_date: string | null;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    status: InvoiceStatus;
    type: InvoiceType;
    recurring_invoice_id: number | null;
    notes: string | null;
    internal_notes: string | null;
    cancellation_reason: string | null;
    payment_date: string | null;
    payment_method: PaymentMethod | null;
    payment_reference: string | null;
    payment_proof_url?: string | null;
    items: InvoiceItem[];
    available_actions: string[];
    created_at: string;
    updated_at: string;
}

export interface InvoiceListItem {
    id: number;
    invoice_number: string;
    customer: {
        id: number;
        name: string;
    };
    invoice_date: string;
    due_date: string | null;
    total: number;
    status: InvoiceStatus;
    type: InvoiceType;
    currency: string;
}

export interface InvoiceItemFormData {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface InvoiceFormData {
    customer_id: number;
    invoice_date: string;
    due_date: string | null;
    tax_rate: number;
    notes?: string;
    internal_notes?: string;
    items: InvoiceItemFormData[];
    send_immediately?: boolean;
}

export interface InvoiceListParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: InvoiceStatus;
    type?: InvoiceType;
    customer_id?: number;
    date_from?: string;
    date_to?: string;
    due_date_from?: string;
    due_date_to?: string;
}

export interface SendInvoiceData {
    recipient_email: string;
    subject: string;
    message: string;
}

export interface MarkAsPaidData {
    payment_date: string;
    payment_method?: PaymentMethod;
    payment_reference?: string;
    notes?: string;
    payment_proof?: File;
}

export interface CancelInvoiceData {
    cancellation_reason: string;
}
