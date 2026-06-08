import { apiClient } from './client';
import { Admin, PaginatedResponse, SingleResponse } from '@/types';

export async function listAdmins(page = 1): Promise<PaginatedResponse<Admin>> {
    return apiClient.get<PaginatedResponse<Admin>>(`/admins?page=${page}`);
}

export async function getAdmin(id: number): Promise<SingleResponse<Admin>> {
    return apiClient.get<SingleResponse<Admin>>(`/admins/${id}`);
}

export async function createAdmin(data: {
    name: string; email: string; password: string; role: 'super_admin' | 'admin' | 'sales';
}): Promise<SingleResponse<Admin>> {
    return apiClient.post<SingleResponse<Admin>>('/admins', data);
}

export async function updateAdmin(id: number, data: Partial<{
    name: string; email: string; password: string; role: 'super_admin' | 'admin' | 'sales';
}>): Promise<SingleResponse<Admin>> {
    return apiClient.put<SingleResponse<Admin>>(`/admins/${id}`, data);
}

export async function deleteAdmin(id: number): Promise<void> {
    await apiClient.delete(`/admins/${id}`);
}
