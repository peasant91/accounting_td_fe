'use client';

import { useRecurringInvoices, useDeleteRecurringInvoice, useManualGenerateInvoice } from '@/lib/hooks';
import { Button, StatusBadge, ConfirmDialog } from '@/components/ui';
import { RecurringInvoice } from '@/types';
import { Loader2, Plus, Edit, Trash2, Play, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface RecurringInvoiceListProps {
    customerId: number;
}

export function RecurringInvoiceList({ customerId }: RecurringInvoiceListProps) {
    const { data, isLoading, error } = useRecurringInvoices(customerId);
    const deleteMutation = useDeleteRecurringInvoice();
    const generateMutation = useManualGenerateInvoice();
    const [terminatingId, setTerminatingId] = useState<number | null>(null);

    const handleTerminate = async () => {
        if (terminatingId) {
            try {
                await deleteMutation.mutateAsync(terminatingId);
                toast.success('Recurring invoice terminated');
            } catch (error) {
                toast.error('Failed to terminate recurring invoice');
            }
            setTerminatingId(null);
        }
    };

    const handleGenerate = async (id: number) => {
        try {
            await generateMutation.mutateAsync(id);
            toast.success('Invoice generated successfully');
        } catch (error) {
            toast.error('Failed to generate invoice');
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>;
    }

    if (error) {
        return <div className="text-destructive p-4">Failed to load recurring invoices</div>;
    }

    const invoices = data as RecurringInvoice[] || [];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Recurring Invoices</h3>
                <Link href={`/customers/${customerId}/recurring/new`}>
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Schedule
                    </Button>
                </Link>
            </div>

            {invoices.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                    No recurring invoice schedules found.
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left">Frequency</th>
                                <th className="px-4 py-3 text-left">Next Run</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className="px-4 py-3 font-medium">{invoice.title}</td>
                                    <td className="px-4 py-3 capitalize">
                                        {invoice.recurrence_type.replace('-', ' ')}
                                        {invoice.recurrence_type === 'counted' && ` (${invoice.generated_count}/${invoice.total_count})`}
                                    </td>
                                    <td className="px-4 py-3">
                                        {invoice.next_invoice_date ? formatDate(invoice.next_invoice_date) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={invoice.status as any} />
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleGenerate(invoice.id)} title="Run Now">
                                            <Play className="h-4 w-4" />
                                        </Button>
                                        <Link href={`/customers/${customerId}/recurring/${invoice.id}/edit`}>
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {invoice.status !== 'terminated' && (
                                            <Button variant="ghost" size="icon" onClick={() => setTerminatingId(invoice.id)} title="Terminate">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                open={!!terminatingId}
                onOpenChange={(open) => !open && setTerminatingId(null)}
                title="Terminate Recurring Invoice"
                description="Are you sure you want to terminate this schedule? No further invoices will be generated."
                confirmText="Terminate"
                onConfirm={handleTerminate}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
