// Customer API functions

import { apiClient } from './client';
import {
    Customer,
    CustomerListItem,
    CustomerFormData,
    CustomerListParams,
    PaginatedResponse,
    SingleResponse,
} from '@/types';

export async function list(params: CustomerListParams = {}): Promise<PaginatedResponse<CustomerListItem>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', String(params.page));
    if (params.per_page) searchParams.append('per_page', String(params.per_page));
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params.sort_order) searchParams.append('sort_order', params.sort_order);

    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<CustomerListItem>>(`/customers${query ? `?${query}` : ''}`);
}

export async function get(id: number): Promise<SingleResponse<Customer>> {
    return apiClient.get<SingleResponse<Customer>>(`/customers/${id}`);
}

export async function create(data: CustomerFormData): Promise<SingleResponse<Customer>> {
    return apiClient.post<SingleResponse<Customer>>('/customers', data);
}

export async function update(id: number, data: CustomerFormData): Promise<SingleResponse<Customer>> {
    return apiClient.put<SingleResponse<Customer>>(`/customers/${id}`, data);
}

export async function remove(id: number): Promise<void> {
    return apiClient.delete(`/customers/${id}`);
}
