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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';

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
    invoiceId?: number;
}

export function InvoiceTemplateBuilder({ customerId, invoiceId }: InvoiceTemplateBuilderProps) {
    const isInvoiceMode = !!invoiceId;

    // Customer template — always fetched; provides labels + defaults
    const { data: customerTemplateData, isLoading: customerLoading, error } = useInvoiceTemplate(customerId);
    // Invoice data — only used in invoice mode
    const { data: invoiceData, isLoading: invoiceLoading } = useInvoice(invoiceId ?? 0);

    const updateMutation = useUpdateCustomerTemplate();
    const updateInvoiceTemplateMutation = useUpdateInvoiceTemplate();
    const resetTemplateMutation = useResetInvoiceTemplate();

    // Saved state (reflects last server response)
    const [components, setComponents] = useState<InvoiceComponentConfig[]>([]);
    const [stampPosition, setStampPosition] = useState<StampPosition | null>(null);

    // Sheet / local edit state
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [localComponents, setLocalComponents] = useState<InvoiceComponentConfig[]>([]);
    const [localStampPosition, setLocalStampPosition] = useState<StampPosition | null>(null);

    // Preview modals
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSheetPreviewOpen, setIsSheetPreviewOpen] = useState(false);

    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const { user } = useAuth();
    const isSales = user?.role === 'sales';

    const isLoading = isInvoiceMode ? invoiceLoading || customerLoading : customerLoading;
    const hasError = !isInvoiceMode && !!error;

    // Seed saved state from server data
    // Bug fix: always use customer template for labels/required; override enabled from invoice if in invoice mode
    useEffect(() => {
        if (!customerTemplateData?.data?.components) return;
        const customerComponents = customerTemplateData.data.components;

        if (isInvoiceMode && invoiceData?.data) {
            const invoiceComponents = invoiceData.data.components as Array<{ key: InvoiceComponentKey; enabled: boolean }> | undefined;
            const invoiceComponentMap = new Map(invoiceComponents?.map(c => [c.key, c.enabled]) ?? []);

            const merged = customerComponents.map(comp => ({
                ...comp,
                enabled: invoiceComponentMap.has(comp.key) ? (invoiceComponentMap.get(comp.key) ?? comp.enabled) : comp.enabled,
            }));
            setComponents(merged);
            setStampPosition(invoiceData.data.stamp_position ?? null);
        } else if (!isInvoiceMode) {
            setComponents(customerComponents);
            setStampPosition(customerTemplateData.data.stamp_position ?? null);
        }
    }, [isInvoiceMode, invoiceData, customerTemplateData]);

    // Customer mode: toggle saves immediately (existing behaviour)
    const handleToggle = (key: InvoiceComponentKey, checked: boolean) => {
        const updated = components.map((comp) => (comp.key === key ? { ...comp, enabled: checked } : comp));
        setComponents(updated);
        const payload = updated.map(({ key: k, enabled }) => ({ key: k, enabled }));
        updateMutation.mutate(
            { customerId, data: { components: payload, stamp_position: stampPosition } },
            {
                onError: () => {
                    toast.error('Failed to save');
                    setComponents((prev) => prev.map((c) => (c.key === key ? { ...c, enabled: !checked } : c)));
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

    // Sheet handlers
    const openSheet = () => {
        setLocalComponents(components);
        setLocalStampPosition(stampPosition);
        setIsSheetOpen(true);
    };

    const handleSheetSave = () => {
        if (!invoiceId) return;
        const payload = localComponents.map(({ key, enabled }) => ({ key, enabled }));
        updateInvoiceTemplateMutation.mutate(
            { id: invoiceId, data: { components: payload, stamp_position: localStampPosition } },
            {
                onSuccess: () => {
                    toast.success('Template saved');
                    setIsSheetOpen(false);
                },
                onError: () => toast.error('Failed to save'),
            }
        );
    };

    const handleResetTemplate = () => {
        if (!invoiceId) return;
        resetTemplateMutation.mutate(
            { id: invoiceId, customerId },
            {
                onSuccess: () => {
                    toast.success('Template reset to company template');
                    setIsResetConfirmOpen(false);
                },
                onError: () => toast.error('Failed to reset template'),
            }
        );
    };

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-6 w-6" /></div>;
    }

    if (hasError) {
        return <div className="p-4 text-red-500">Failed to load invoice template</div>;
    }

    // ── Customer mode (non-invoice): unchanged inline editor ──────────────────
    if (!isInvoiceMode) {
        return (
            <Card className="w-full mt-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                        <CardTitle>Invoice Template</CardTitle>
                        <CardDescription>Customize the invoice layout for this customer.</CardDescription>
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
                                    disabled={component.required}
                                />
                            </div>
                        ))}
                    </div>
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
                </CardContent>
                <InvoicePreviewModal customerId={customerId} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
            </Card>
        );
    }

    // ── Invoice mode: 3-button row ─────────────────────────────────────────────
    return (
        <>
            <div className="flex flex-wrap items-center gap-2 pt-2">
                {!isSales && (
                    <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">Follow Current Template</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Follow company template?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will replace this invoice&apos;s format with the current company template. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetTemplate} disabled={resetTemplateMutation.isPending}>
                                    {resetTemplateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Confirm
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {!isSales && (
                    <Button variant="secondary" size="sm" onClick={openSheet}>
                        Edit Template
                    </Button>
                )}

                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                </Button>
            </div>

            {/* Preview using saved invoice template */}
            <InvoicePreviewModal
                customerId={customerId}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                templateOverride={{ components, stamp_position: stampPosition }}
            />

            {/* Edit Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-[420px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle>Edit Invoice Format</SheetTitle>
                        <SheetDescription>Override the layout for this specific invoice.</SheetDescription>
                    </SheetHeader>

                    <div className="px-6 space-y-6 flex-1">
                        {/* Component toggles */}
                        <div className="space-y-3">
                            {localComponents.map((component) => (
                                <div key={component.key} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <Label htmlFor={`sheet-switch-${component.key}`} className="text-base font-medium">
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
                                        id={`sheet-switch-${component.key}`}
                                        checked={component.enabled}
                                        onCheckedChange={(checked) =>
                                            setLocalComponents((prev) =>
                                                prev.map((c) => (c.key === component.key ? { ...c, enabled: checked } : c))
                                            )
                                        }
                                        disabled={component.required}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Stamp position */}
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
                                        onClick={() => setLocalStampPosition(prev => prev === zone.position ? null : zone.position)}
                                        style={{ gridColumn: zone.col, gridRow: zone.row }}
                                        className={`py-3 px-2 text-xs font-medium transition-colors ${
                                            localStampPosition === zone.position
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background hover:bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {zone.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSheetPreviewOpen(true)}
                            disabled={updateInvoiceTemplateMutation.isPending}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSheetOpen(false)}
                            disabled={updateInvoiceTemplateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSheetSave}
                            disabled={updateInvoiceTemplateMutation.isPending}
                        >
                            {updateInvoiceTemplateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Preview using local (unsaved) state from within the sheet */}
            <InvoicePreviewModal
                customerId={customerId}
                isOpen={isSheetPreviewOpen}
                onClose={() => setIsSheetPreviewOpen(false)}
                templateOverride={{ components: localComponents, stamp_position: localStampPosition }}
            />
        </>
    );
}
