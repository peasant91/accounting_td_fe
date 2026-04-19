'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/currency-rates';

export function useCurrencyRates() {
    return useQuery({
        queryKey: ['currency-rates'],
        queryFn: () => api.list(),
    });
}

export function useUpsertCurrencyRate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ currency, rate_to_base }: { currency: string; rate_to_base: number }) =>
            api.upsert(currency, rate_to_base),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['currency-rates'] });
            qc.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}
