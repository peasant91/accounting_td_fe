import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoiceTemplate, updateInvoiceTemplate, getInvoicePreview } from '../api/invoice-templates';
import { InvoiceTemplateFormData } from '../../types/invoice-template';

export const useInvoiceTemplate = (customerId: number) => {
    return useQuery({
        queryKey: ['invoice-template', customerId],
        queryFn: () => getInvoiceTemplate(customerId),
    });
};

export const useUpdateInvoiceTemplate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ customerId, data }: { customerId: number; data: InvoiceTemplateFormData }) =>
            updateInvoiceTemplate(customerId, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoice-template', variables.customerId] });
            queryClient.invalidateQueries({ queryKey: ['invoice-template-preview', variables.customerId] });
        },
    });
};

export const useInvoicePreview = (customerId: number, enabled: boolean) => {
    return useQuery({
        queryKey: ['invoice-template-preview', customerId],
        queryFn: () => getInvoicePreview(customerId),
        enabled: enabled,
    });
};
