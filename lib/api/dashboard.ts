// Dashboard API functions

import { apiClient } from './client';
import { DashboardSummary, SingleResponse } from '@/types';

export async function getSummary(): Promise<SingleResponse<DashboardSummary>> {
    return apiClient.get<SingleResponse<DashboardSummary>>('/dashboard/summary');
}
