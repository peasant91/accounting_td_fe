'use client';

import { useRef } from 'react';
import { useInvoiceSettings, useUpdateInvoiceSettings } from '@/lib/hooks/useInvoiceSettings';
import { Button } from '@/components/ui';
import { FileText } from 'lucide-react';
import { StampPosition } from '@/types/invoice-setting';
import * as invoiceSettingsApi from '@/lib/api/invoice-settings';

const ZONES: { position: StampPosition; label: string; col: number; row: number }[] = [
    { position: 'top_left',     label: 'Top Left',   col: 1, row: 1 },
    { position: 'top_right',    label: 'Top Right',  col: 3, row: 1 },
    { position: 'center_left',  label: 'Mid Left',   col: 1, row: 2 },
    { position: 'center',       label: 'Center',     col: 2, row: 2 },
    { position: 'center_right', label: 'Mid Right',  col: 3, row: 2 },
    { position: 'bottom_left',  label: 'Bot Left',   col: 1, row: 3 },
    { position: 'bottom_right', label: 'Bot Right',  col: 3, row: 3 },
];

export default function InvoiceSettingsPage() {
    const { data, isLoading } = useInvoiceSettings();
    const updateSettings = useUpdateInvoiceSettings();
    const noteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const setting = data?.data;

    function handlePositionSelect(position: StampPosition) {
        updateSettings.mutate({ stamp_position: position });
    }

    function handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const value = e.target.value;
        if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
        noteTimeoutRef.current = setTimeout(() => {
            updateSettings.mutate({ default_note: value || null });
        }, 600);
    }

    function handlePreview() {
        window.open(invoiceSettingsApi.previewPdfUrl(), '_blank', 'noreferrer');
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Invoice Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">Configure stamp position and default note for all invoices.</p>
            </div>

            {/* Stamp section */}
            <div className="border rounded-lg p-6 space-y-6">
                <h2 className="font-semibold text-lg">Company Stamp</h2>

                {/* Fixed stamp preview */}
                <div className="flex items-center gap-4">
                    <img
                        src="/stamp.png"
                        alt="PT. Timedoor Indonesia stamp"
                        className="w-24 h-24 object-contain"
                    />
                    <div>
                        <p className="text-sm font-medium">PT. Timedoor Indonesia</p>
                        <p className="text-xs text-muted-foreground mt-1">Stamp appears on all invoice PDFs at the selected position.</p>
                    </div>
                </div>

                {/* Position picker — 3x3 grid with gaps */}
                <div className="space-y-3">
                    <p className="text-sm font-medium">Stamp position on invoice</p>
                    <div className="border rounded-lg overflow-hidden" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gap: '1px', background: '#e5e7eb', maxWidth: '240px' }}>
                        {/* Top-center filler (no stamp position there) */}
                        <div style={{ gridColumn: 2, gridRow: 1 }} className="bg-background" />
                        {/* Bottom-center filler */}
                        <div style={{ gridColumn: 2, gridRow: 3 }} className="bg-background" />
                        {ZONES.map(zone => (
                            <button
                                key={zone.position}
                                onClick={() => handlePositionSelect(zone.position)}
                                style={{ gridColumn: zone.col, gridRow: zone.row }}
                                className={`py-3 px-2 text-xs font-medium transition-colors ${
                                    setting?.stamp_position === zone.position
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                {zone.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Changes save automatically.</p>
                </div>

                <Button variant="outline" size="sm" onClick={handlePreview}>
                    <FileText className="h-4 w-4 mr-2" />
                    Preview PDF
                </Button>
            </div>

            {/* Default Note section */}
            <div className="border rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-lg">Default Invoice Note</h2>
                <p className="text-sm text-muted-foreground">Pre-filled in the External Notes field for every new invoice. Editable per invoice.</p>
                <textarea
                    defaultValue={setting?.default_note ?? ''}
                    onChange={handleNoteChange}
                    rows={4}
                    placeholder="e.g. Thank you for your business. Payment due within 30 days."
                    className="w-full border rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Saves automatically.</p>
            </div>
        </div>
    );
}
