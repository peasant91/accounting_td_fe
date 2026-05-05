import { apiClient } from './client';
import { ActivityLogEntry, LoginAttempt, PaginatedResponse } from '@/types';

export type ActivityFilters = {
    user_id?: number;
    action?: string;
    loggable_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
};

export type LoginAttemptFilters = {
    email?: string;
    ip?: string;
    successful?: boolean;
    date_from?: string;
    date_to?: string;
    page?: number;
};

function toQuery(params: Record<string, unknown>): string {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    }
    const s = q.toString();
    return s ? `?${s}` : '';
}

export async function getActivity(filters: ActivityFilters = {}): Promise<PaginatedResponse<ActivityLogEntry>> {
    return apiClient.get<PaginatedResponse<ActivityLogEntry>>(`/audit/activity${toQuery(filters)}`);
}

export async function getLoginAttempts(filters: LoginAttemptFilters = {}): Promise<PaginatedResponse<LoginAttempt>> {
    return apiClient.get<PaginatedResponse<LoginAttempt>>(`/audit/login-attempts${toQuery(filters)}`);
}
