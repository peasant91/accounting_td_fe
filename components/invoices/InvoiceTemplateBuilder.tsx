'use client';

import React, { useState, useEffect } from 'react';
import { useInvoiceTemplate, useUpdateInvoiceTemplate as useUpdateCustomerTemplate } from '@/lib/hooks/useInvoiceTemplates';
import { useInvoice, useUpdateInvoiceTemplate, useResetInvoiceTemplate } from '@/lib/hooks/useInvoices';
import { InvoiceComponentConfig, InvoiceComponentKey, StampPosition } from '@/types/invoice-template';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { useAuth } from '@/lib/auth';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const STAMP_ZONES: { position: StampPosition; label: string; col: number; row: number }[] = [
    { position: 'top_left',     label: 'Top Left',   col: 1, row: 1 },
    { position: 'top_right',    label: 'Top Right',  col: 3, row: 1 },
    { position: 'center_left',  label: 'Mid Left',   col: 1, row: 2 },
    { position: 'center',       label: 'Center',     col: 2, row: 2 },
    { position: 'center_right', label: 'Mid Right',  col: 3, row: 2 },
    { position: 'bottom_left',  label: 'Bot Left',   col: 1, row: 3 },
    { position: 'bottom_right', label: 'Bot Right',  col: 3, row: 3 },
];

interface InvoiceTemplateBuilderProps {
    customerId: number;
    invoiceId?: number;  // when present: invoice-scoped mode
}

export function InvoiceTemplateBuilder({ customerId, invoiceId }: InvoiceTemplateBuilderProps) {
    const isInvoiceMode = !!invoiceId;

    const { data, isLoading: customerLoading, error } = useInvoiceTemplate(customerId);
    const { data: invoiceData, isLoading: invoiceLoading } = useInvoice(invoiceId ?? 0);
    const updateMutation = useUpdateCustomerTemplate();
    const updateInvoiceTemplateMutation = useUpdateInvoiceTemplate();
    const resetTemplateMutation = useResetInvoiceTemplate();
    const [components, setComponents] = useState<InvoiceComponentConfig[]>([]);
    const [stampPosition, setStampPosition] = useState<StampPosition | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const { user } = useAuth();
    const isSales = user?.role === 'sales';

    const isLoading = isInvoiceMode ? invoiceLoading : customerLoading;
    const hasError = isInvoiceMode ? false : !!error;

    useEffect(() => {
        if (isInvoiceMode && invoiceData?.data) {
            const inv = invoiceData.data;
            if (inv.components) setComponents(inv.components as InvoiceComponentConfig[]);
            if (inv.stamp_position !== undefined) setStampPosition(inv.stamp_position);
        } else if (!isInvoiceMode && data?.data) {
            if (data.data.components) setComponents(data.data.components);
            if (data.data.stamp_position !== undefined) setStampPosition(data.data.stamp_position);
        }
    }, [isInvoiceMode, invoiceData, data]);

    const handleToggle = (key: InvoiceComponentKey, checked: boolean) => {
        const updated = components.map((comp) => (comp.key === key ? { ...comp, enabled: checked } : comp));
        setComponents(updated);
        const payload = updated.map(({ key: k, enabled }) => ({ key: k, enabled }));

        if (isInvoiceMode && invoiceId) {
            updateInvoiceTemplateMutation.mutate(
                { id: invoiceId, data: { components: payload, stamp_position: stampPosition } },
                {
                    onError: () => {
                        toast.error('Failed to save');
                        setComponents((prev) => prev.map((c) => (c.key === key ? { ...c, enabled: !checked } : c)));
                    },
                }
            );
        } else {
            updateMutation.mutate(
                { customerId, data: { components: payload, stamp_position: stampPosition } },
                {
                    onError: () => {
                        toast.error('Failed to save');
                        setComponents((prev) => prev.map((c) => (c.key === key ? { ...c, enabled: !checked } : c)));
                    },
                }
            );
        }
    };

    const handleStampPosition = (position: StampPosition) => {
        const newPos = stampPosition === position ? null : position;
        setStampPosition(newPos);
        const payload = components.map(({ key, enabled }) => ({ key, enabled }));

        if (isInvoiceMode && invoiceId) {
            updateInvoiceTemplateMutation.mutate(
                { id: invoiceId, data: { components: payload, stamp_position: newPos } },
                { onError: () => toast.error('Failed to save') }
            );
        } else {
            updateMutation.mutate(
                { customerId, data: { components: payload, stamp_position: newPos } },
                { onError: () => toast.error('Failed to save') }
            );
        }
    };

    const handleResetTemplate = () => {
        if (!invoiceId) return;
        resetTemplateMutation.mutate({ id: invoiceId, customerId }, {
            onSuccess: () => {
                toast.success('Template reset to current company template');
                setIsResetConfirmOpen(false);
            },
            onError: () => toast.error('Failed to reset template'),
        });
    };

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-6 w-6" /></div>;
    }

    if (hasError) {
        return <div className="p-4 text-red-500">Failed to load invoice template</div>;
    }

    return (
        <Card className="w-full mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle>{isInvoiceMode ? 'Invoice Format' : 'Invoice Template'}</CardTitle>
                    <CardDescription>
                        {isInvoiceMode
                            ? 'Override the invoice layout for this specific invoice.'
                            : 'Customize the invoice layout for this customer.'}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {(updateMutation.isPending || updateInvoiceTemplateMutation.isPending || resetTemplateMutation.isPending) && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {isInvoiceMode && !isSales && (
                        <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">Use Current Template</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Reset invoice format?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will replace this invoice&apos;s format with the current company template. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleResetTemplate} disabled={resetTemplateMutation.isPending}>
                                        {resetTemplateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Reset
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Component toggles */}
                <div className="space-y-3">
                    {components.map((component) => (
                        <div key={component.key} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor={`switch-${component.key}`} className="text-base font-medium">
                                    {component.label}
                                </Label>
                                {component.key === 'external_notes' && (
                                    <p className="text-xs text-muted-foreground">Shows a bordered note container on the invoice</p>
                                )}
                                {component.required && (
                                    <p className="text-xs text-muted-foreground">Required component</p>
                                )}
                            </div>
                            <Switch
                                id={`switch-${component.key}`}
                                checked={component.enabled}
                                onCheckedChange={(checked) => handleToggle(component.key, checked)}
                                disabled={component.required || isSales}
                            />
                        </div>
                    ))}
                </div>

                {/* Stamp position */}
                {!isSales && (
                    <div className="space-y-3 pt-2 border-t border-border">
                        <div className="flex items-center gap-3">
                            <img src="/stamp.png" alt="Stamp" className="w-12 h-12 object-contain" />
                            <div>
                                <p className="text-sm font-medium">Stamp Position</p>
                                <p className="text-xs text-muted-foreground">Click a position to place the stamp. Click again to remove.</p>
                            </div>
                        </div>
                        <div
                            className="border rounded-lg overflow-hidden"
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gap: '1px', background: '#e5e7eb', maxWidth: '240px' }}
                        >
                            <div style={{ gridColumn: 2, gridRow: 1 }} className="bg-background" />
                            <div style={{ gridColumn: 2, gridRow: 3 }} className="bg-background" />
                            {STAMP_ZONES.map(zone => (
                                <button
                                    key={zone.position}
                                    onClick={() => handleStampPosition(zone.position)}
                                    style={{ gridColumn: zone.col, gridRow: zone.row }}
                                    className={`py-3 px-2 text-xs font-medium transition-colors ${
                                        stampPosition === zone.position
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-background hover:bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {zone.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>

            <InvoicePreviewModal
                customerId={customerId}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
            />
        </Card>
    );
}
