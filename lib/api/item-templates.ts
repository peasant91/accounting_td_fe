import { apiClient } from './client';
import { ItemTemplate, ItemTemplateFormData, SingleResponse } from '@/types';

interface ListResponse {
    data: ItemTemplate[];
}

export async function list(): Promise<ListResponse> {
    return apiClient.get<ListResponse>('/item-templates');
}

export async function create(data: ItemTemplateFormData): Promise<SingleResponse<ItemTemplate>> {
    return apiClient.post<SingleResponse<ItemTemplate>>('/item-templates', data);
}

export async function update(id: number, data: ItemTemplateFormData): Promise<SingleResponse<ItemTemplate>> {
    return apiClient.put<SingleResponse<ItemTemplate>>(`/item-templates/${id}`, data);
}

export async function remove(id: number): Promise<void> {
    return apiClient.delete(`/item-templates/${id}`);
}
