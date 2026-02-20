import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/recurring-invoices';

export function useRecurringInvoices(customerId: number) {
    return useQuery({
        queryKey: ['recurring-invoices', customerId],
        queryFn: () => api.list(customerId),
        enabled: !!customerId,
    });
}

export function useRecurringInvoice(id: number) {
    return useQuery({
        queryKey: ['recurring-invoice', id],
        queryFn: () => api.get(id),
        enabled: !!id,
    });
}

export function useCreateRecurringInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: api.RecurringInvoiceFormData) => api.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recurring-invoices', variables.customer_id] });
        },
    });
}

export function useUpdateRecurringInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<api.RecurringInvoiceFormData> }) =>
            api.update(id, data),
        onSuccess: (response) => {
            const customerId = response.data.customer_id;
            queryClient.invalidateQueries({ queryKey: ['recurring-invoices', customerId] });
            queryClient.invalidateQueries({ queryKey: ['recurring-invoice', response.data.id] });
        },
    });
}

export function useDeleteRecurringInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
        },
    });
}

export function useManualGenerateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.manualGenerate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
        },
    });
}
