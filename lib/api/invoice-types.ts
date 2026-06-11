import { apiClient } from './client';
import { InvoiceType, InvoiceTypeFormData } from '@/types/invoice-type';

export async function list(): Promise<{ data: InvoiceType[] }> {
    return apiClient.get<{ data: InvoiceType[] }>('/invoice-types');
}

export async function create(data: InvoiceTypeFormData): Promise<{ data: InvoiceType }> {
    return apiClient.post<{ data: InvoiceType }>('/invoice-types', data);
}

export async function update(id: number, data: Partial<InvoiceTypeFormData> & { is_active?: boolean }): Promise<{ data: InvoiceType }> {
    return apiClient.put<{ data: InvoiceType }>(`/invoice-types/${id}`, data);
}
