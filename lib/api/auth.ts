import { apiClient } from './client';
import { User } from '@/types';

export async function login(email: string, password: string): Promise<void> {
    await apiClient.post('/login', { email, password });
}

export async function logout(all = false): Promise<void> {
    await apiClient.post('/logout', all ? { all: true } : undefined);
}

export async function getMe(): Promise<{ data: User }> {
    return apiClient.get<{ data: User }>('/me');
}
