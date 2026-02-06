'use client';

import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '@/lib/api/dashboard';

export function useDashboard() {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: () => dashboardApi.getSummary(),
        refetchInterval: 60 * 1000, // Refetch every minute
    });
}
