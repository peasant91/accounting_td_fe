'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as invoiceTypesApi from '@/lib/api/invoice-types';
import { InvoiceTypeFormData } from '@/types/invoice-type';

export function useInvoiceTypes() {
    return useQuery({
        queryKey: ['invoice-types'],
        queryFn: () => invoiceTypesApi.list(),
    });
}

export function useCreateInvoiceType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: InvoiceTypeFormData) => invoiceTypesApi.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice-types'] }),
    });
}

export function useUpdateInvoiceType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<InvoiceTypeFormData> & { is_active?: boolean } }) =>
            invoiceTypesApi.update(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice-types'] }),
    });
}
