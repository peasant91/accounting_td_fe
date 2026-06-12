'use client';

import React, { useState, useEffect } from 'react';
import { useInvoiceTemplate, useUpdateInvoiceTemplate } from '@/lib/hooks/useInvoiceTemplates';
import { InvoiceComponentConfig, InvoiceComponentKey, StampPosition } from '@/types/invoice-template';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { useAuth } from '@/lib/auth';

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
}

export function InvoiceTemplateBuilder({ customerId }: InvoiceTemplateBuilderProps) {
    const { data, isLoading, error } = useInvoiceTemplate(customerId);
    const updateMutation = useUpdateInvoiceTemplate();
    const [components, setComponents] = useState<InvoiceComponentConfig[]>([]);
    const [stampPosition, setStampPosition] = useState<StampPosition | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const { user } = useAuth();
    const isSales = user?.role === 'sales';

    useEffect(() => {
        if (data?.data) {
            if (data.data.components) setComponents(data.data.components);
            if (data.data.stamp_position !== undefined) setStampPosition(data.data.stamp_position);
        }
    }, [data]);

    const handleToggle = (key: InvoiceComponentKey, checked: boolean) => {
        const updated = components.map((comp) => (comp.key === key ? { ...comp, enabled: checked } : comp));
        setComponents(updated);
        const payload = updated.map(({ key: k, enabled }) => ({ key: k, enabled }));
        updateMutation.mutate(
            { customerId, data: { components: payload, stamp_position: stampPosition } },
            {
                onError: () => {
                    toast.error('Failed to save');
                    setComponents((prev) => prev.map((comp) => (comp.key === key ? { ...comp, enabled: !checked } : comp)));
                },
            }
        );
    };

    const handleStampPosition = (position: StampPosition) => {
        const newPos = stampPosition === position ? null : position;
        setStampPosition(newPos);
        const payload = components.map(({ key, enabled }) => ({ key, enabled }));
        updateMutation.mutate(
            { customerId, data: { components: payload, stamp_position: newPos } },
            { onError: () => toast.error('Failed to save') }
        );
    };

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-6 w-6" /></div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">Failed to load invoice template</div>;
    }

    return (
        <Card className="w-full mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle>Invoice Template</CardTitle>
                    <CardDescription>
                        Customize the invoice layout for this customer.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
