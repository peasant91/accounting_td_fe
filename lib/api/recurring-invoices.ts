import { apiClient } from './client';
import { RecurringInvoice, RecurrenceType, RecurrenceUnit } from '@/types'; // Need to update types

export interface RecurringInvoiceFormData {
    customer_id: number;
    title: string;
    recurrence_type: RecurrenceType;
    recurrence_interval: number;
    recurrence_unit?: RecurrenceUnit | null;
    total_count?: number | null;
    start_date: string;
    due_date_offset?: number;
    notes?: string;
    line_items: any[]; // define proper type
    tax_rate: number;
    currency: string;
}

export async function list(customerId: number): Promise<RecurringInvoice[]> {
    return apiClient.get<RecurringInvoice[]>(`/customers/${customerId}/recurring-invoices`);
}

export async function get(id: number): Promise<{ data: RecurringInvoice }> {
    return apiClient.get<{ data: RecurringInvoice }>(`/recurring-invoices/${id}`);
}

export async function create(data: RecurringInvoiceFormData): Promise<{ data: RecurringInvoice }> {
    return apiClient.post<{ data: RecurringInvoice }>('/recurring-invoices', data);
}

export async function update(id: number, data: Partial<RecurringInvoiceFormData>): Promise<{ data: RecurringInvoice }> {
    return apiClient.put<{ data: RecurringInvoice }>(`/recurring-invoices/${id}`, data);
}

export async function remove(id: number): Promise<void> {
    return apiClient.delete(`/recurring-invoices/${id}`);
}

export async function manualGenerate(id: number): Promise<{ message: string; invoice_id: number }> {
    return apiClient.post<{ message: string; invoice_id: number }>(`/recurring-invoices/${id}/generate`, {});
}
