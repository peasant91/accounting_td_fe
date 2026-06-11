import { apiClient } from './client';
import { ImportResults } from '@/types/import';

export async function previewImport(file: File): Promise<ImportResults> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ImportResults>('/import/invoices?dry_run=true', formData);
}

export async function commitImport(file: File): Promise<ImportResults> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ImportResults>('/import/invoices', formData);
}

export function templateUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
    return `${baseUrl}/import/template`;
}
