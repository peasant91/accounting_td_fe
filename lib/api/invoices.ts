// Invoice API functions

import { apiClient } from './client';
import {
    Invoice,
    InvoiceListItem,
    InvoiceFormData,
    InvoiceListParams,
    SendInvoiceData,
    MarkAsPaidData,
    CancelInvoiceData,
    PaginatedResponse,
    SingleResponse,
} from '@/types';

export async function list(params: InvoiceListParams = {}): Promise<PaginatedResponse<InvoiceListItem>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', String(params.page));
    if (params.per_page) searchParams.append('per_page', String(params.per_page));
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.type) searchParams.append('type', params.type);
    if (params.customer_id) searchParams.append('customer_id', String(params.customer_id));
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.due_date_from) searchParams.append('due_date_from', params.due_date_from);
    if (params.due_date_to) searchParams.append('due_date_to', params.due_date_to);

    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<InvoiceListItem>>(`/invoices${query ? `?${query}` : ''}`);
}

export async function get(id: number): Promise<SingleResponse<Invoice>> {
    return apiClient.get<SingleResponse<Invoice>>(`/invoices/${id}`);
}

export async function create(data: InvoiceFormData): Promise<SingleResponse<Invoice>> {
    return apiClient.post<SingleResponse<Invoice>>('/invoices', data);
}

export async function update(id: number, data: InvoiceFormData): Promise<SingleResponse<Invoice>> {
    return apiClient.put<SingleResponse<Invoice>>(`/invoices/${id}`, data);
}

export async function remove(id: number): Promise<void> {
    return apiClient.delete(`/invoices/${id}`);
}

export async function send(id: number, data: SendInvoiceData): Promise<void> {
    return apiClient.post(`/invoices/${id}/send`, data);
}

export async function resend(id: number, data: SendInvoiceData): Promise<void> {
    return apiClient.post(`/invoices/${id}/resend`, data);
}

export async function sendReminder(id: number, data: SendInvoiceData): Promise<void> {
    return apiClient.post(`/invoices/${id}/send-reminder`, data);
}

export async function markAsPaid(id: number, data: MarkAsPaidData): Promise<SingleResponse<Invoice>> {
    const formData = new FormData();
    formData.append('payment_date', data.payment_date);
    if (data.payment_method) formData.append('payment_method', data.payment_method);
    if (data.payment_reference) formData.append('payment_reference', data.payment_reference);
    if (data.notes) formData.append('notes', data.notes);
    if (data.payment_proof) formData.append('payment_proof', data.payment_proof);

    return apiClient.post<SingleResponse<Invoice>>(`/invoices/${id}/mark-as-paid`, formData);
}

export async function cancel(id: number, data: CancelInvoiceData): Promise<SingleResponse<Invoice>> {
    return apiClient.post<SingleResponse<Invoice>>(`/invoices/${id}/cancel`, data);
}

export function downloadPdf(id: number, invoiceNumber: string): Promise<void> {
    return apiClient.download(`/invoices/${id}/pdf`, `${invoiceNumber}.pdf`);
}
