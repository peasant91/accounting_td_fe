'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as customersApi from '@/lib/api/customers';
import { CustomerListParams, CustomerFormData } from '@/types';

export function useCustomers(params: CustomerListParams = {}) {
    return useQuery({
        queryKey: ['customers', params],
        queryFn: () => customersApi.list(params),
    });
}

export function useCustomer(id: number) {
    return useQuery({
        queryKey: ['customers', id],
        queryFn: () => customersApi.get(id),
        enabled: !!id,
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CustomerFormData) => customersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CustomerFormData }) =>
            customersApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customers', id] });
        },
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => customersApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}
