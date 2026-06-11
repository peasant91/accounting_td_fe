// Order API functions

import { apiClient } from './client';
import { Order, OrderFormData, OrderListParams } from '@/types/order';
import { PaginatedResponse, SingleResponse } from '@/types';

export async function list(params: OrderListParams = {}): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    if (params.customer_id) searchParams.append('customer_id', String(params.customer_id));
    if (params.status) searchParams.append('status', params.status);
    if (params.invoice_type_id) searchParams.append('invoice_type_id', String(params.invoice_type_id));
    if (params.sales_pic) searchParams.append('sales_pic', params.sales_pic);
    if (params.jp) searchParams.append('jp', params.jp);
    if (params.source) searchParams.append('source', params.source);
    if (params.page) searchParams.append('page', String(params.page));
    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<Order>>(`/orders${query ? `?${query}` : ''}`);
}

export async function get(id: number): Promise<SingleResponse<Order>> {
    return apiClient.get<SingleResponse<Order>>(`/orders/${id}`);
}

export async function create(data: OrderFormData): Promise<SingleResponse<Order>> {
    return apiClient.post<SingleResponse<Order>>('/orders', data);
}

export async function update(id: number, data: Partial<OrderFormData> & { status?: string }): Promise<SingleResponse<Order>> {
    return apiClient.put<SingleResponse<Order>>(`/orders/${id}`, data);
}

export async function remove(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/orders/${id}`);
}

export async function listForCustomer(customerId: number, params: Omit<OrderListParams, 'customer_id'> = {}): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', String(params.page));
    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<Order>>(`/customers/${customerId}/orders${query ? `?${query}` : ''}`);
}
