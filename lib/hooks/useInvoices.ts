'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as invoicesApi from '@/lib/api/invoices';
import {
    InvoiceListParams,
    InvoiceFormData,
    SendInvoiceData,
    MarkAsPaidData,
    CancelInvoiceData,
} from '@/types';

export function useInvoices(params: InvoiceListParams = {}) {
    return useQuery({
        queryKey: ['invoices', params],
        queryFn: () => invoicesApi.list(params),
    });
}

export function useInvoice(id: number) {
    return useQuery({
        queryKey: ['invoices', id],
        queryFn: () => invoicesApi.get(id),
        enabled: !!id,
    });
}

export function useCreateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: InvoiceFormData) => invoicesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

export function useUpdateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: InvoiceFormData }) =>
            invoicesApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoices', id] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

export function useDeleteInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => invoicesApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useSendInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: SendInvoiceData }) =>
            invoicesApi.send(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoices', id] });
        },
    });
}

export function useMarkAsPaid() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: MarkAsPaidData }) =>
            invoicesApi.markAsPaid(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoices', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

export function useCancelInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CancelInvoiceData }) =>
            invoicesApi.cancel(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoices', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}
