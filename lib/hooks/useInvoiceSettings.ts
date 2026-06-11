'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as invoiceSettingsApi from '@/lib/api/invoice-settings';
import { InvoiceSettingUpdateData } from '@/types/invoice-setting';

export function useInvoiceSettings() {
    return useQuery({
        queryKey: ['invoice-settings'],
        queryFn: () => invoiceSettingsApi.get(),
    });
}

export function useUpdateInvoiceSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: InvoiceSettingUpdateData) => invoiceSettingsApi.update(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice-settings'] }),
    });
}

export function useUploadStamp() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => invoiceSettingsApi.uploadStamp(file),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice-settings'] }),
    });
}

export function useDeleteStamp() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => invoiceSettingsApi.deleteStamp(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice-settings'] }),
    });
}
