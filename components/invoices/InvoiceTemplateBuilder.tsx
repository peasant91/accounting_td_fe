'use client';

import React, { useState, useEffect } from 'react';
import { useInvoiceTemplate, useUpdateInvoiceTemplate } from '@/lib/hooks/useInvoiceTemplates';
import { InvoiceComponentConfig, InvoiceComponentKey } from '@/types/invoice-template';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { useAuth } from '@/lib/auth';

interface InvoiceTemplateBuilderProps {
    customerId: number;
}

export function InvoiceTemplateBuilder({ customerId }: InvoiceTemplateBuilderProps) {
    const { data, isLoading, error } = useInvoiceTemplate(customerId);
    const updateMutation = useUpdateInvoiceTemplate();
    const [components, setComponents] = useState<InvoiceComponentConfig[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const { user } = useAuth();
    const isSales = user?.role === 'sales';

    useEffect(() => {
        if (data?.data?.components) {
            setComponents(data.data.components);
        }
    }, [data]);

    const handleToggle = (key: InvoiceComponentKey, checked: boolean) => {
        const updated = components.map((comp) => (comp.key === key ? { ...comp, enabled: checked } : comp));
        setComponents(updated);
        const payload = updated.map(({ key: k, enabled }) => ({ key: k, enabled }));
        updateMutation.mutate(
            { customerId, data: { components: payload } },
            {
                onError: () => {
                    toast.error('Failed to save');
                    setComponents((prev) => prev.map((comp) => (comp.key === key ? { ...comp, enabled: !checked } : comp)));
                },
            }
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
            <CardContent>
                <div className="space-y-4">
                    {components.map((component) => (
                        <div key={component.key} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor={`switch-${component.key}`} className="text-base font-medium">
                                    {component.label}
                                </Label>
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
            </CardContent>

            <InvoicePreviewModal
                customerId={customerId}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
            />
        </Card>
    );
}
