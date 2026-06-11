'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ordersApi from '@/lib/api/orders';
import { OrderFormData, OrderListParams } from '@/types/order';

export function useOrders(params: OrderListParams = {}) {
    return useQuery({
        queryKey: ['orders', params],
        queryFn: () => ordersApi.list(params),
    });
}

export function useOrder(id: number) {
    return useQuery({
        queryKey: ['orders', id],
        queryFn: () => ordersApi.get(id),
        enabled: !!id,
    });
}

export function useCustomerOrders(customerId: number) {
    return useQuery({
        queryKey: ['orders', 'customer', customerId],
        queryFn: () => ordersApi.listForCustomer(customerId),
        enabled: !!customerId,
    });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: OrderFormData) => ordersApi.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
    });
}

export function useUpdateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<OrderFormData> & { status?: string } }) =>
            ordersApi.update(id, data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders', vars.id] });
        },
    });
}

export function useDeleteOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => ordersApi.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
    });
}
