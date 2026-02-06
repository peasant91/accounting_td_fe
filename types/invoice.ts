// Invoice types

import { Customer } from './customer';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'other';

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
    invoice_date: string;
    due_date: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    status: InvoiceStatus;
    notes: string | null;
    internal_notes: string | null;
    cancellation_reason: string | null;
    payment_date: string | null;
    payment_method: PaymentMethod | null;
    payment_reference: string | null;
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
    due_date: string;
    total: number;
    status: InvoiceStatus;
}

export interface InvoiceItemFormData {
    description: string;
    quantity: number;
    unit_price: number;
}

export interface InvoiceFormData {
    customer_id: number;
    invoice_date: string;
    due_date: string;
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
}

export interface CancelInvoiceData {
    cancellation_reason: string;
}
