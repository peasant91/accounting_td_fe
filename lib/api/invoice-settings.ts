import { apiClient } from './client';
import { InvoiceSetting, InvoiceSettingUpdateData } from '@/types/invoice-setting';

export async function get(): Promise<{ data: InvoiceSetting }> {
    return apiClient.get<{ data: InvoiceSetting }>('/invoice-settings');
}

export async function update(data: InvoiceSettingUpdateData): Promise<{ data: InvoiceSetting }> {
    return apiClient.put<{ data: InvoiceSetting }>('/invoice-settings', data);
}

export async function uploadStamp(file: File): Promise<{ data: InvoiceSetting }> {
    const form = new FormData();
    form.append('stamp', file);
    return apiClient.post<{ data: InvoiceSetting }>('/invoice-settings/stamp', form);
}

export async function deleteStamp(): Promise<{ data: InvoiceSetting }> {
    return apiClient.delete<{ data: InvoiceSetting }>('/invoice-settings/stamp');
}

export function previewPdfUrl(): string {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8100/api/v1';
    return `${base}/invoice-settings/preview-pdf`;
}
