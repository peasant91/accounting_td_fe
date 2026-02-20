import { apiClient } from './client';
import { InvoiceTemplate, InvoiceTemplateFormData, InvoicePreviewData } from '../../types/invoice-template';

export async function getInvoiceTemplate(customerId: number): Promise<{ data: InvoiceTemplate }> {
    return apiClient.get<{ data: InvoiceTemplate }>(`/customers/${customerId}/invoice-template`);
}

export async function updateInvoiceTemplate(customerId: number, data: InvoiceTemplateFormData): Promise<{ data: InvoiceTemplate }> {
    return apiClient.put<{ data: InvoiceTemplate }>(`/customers/${customerId}/invoice-template`, data);
}

export async function getInvoicePreview(customerId: number): Promise<{ data: InvoicePreviewData }> {
    return apiClient.get<{ data: InvoicePreviewData }>(`/customers/${customerId}/invoice-template/preview`);
}
