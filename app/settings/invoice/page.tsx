'use client';

import { useRef, useState } from 'react';
import { useInvoiceSettings, useUpdateInvoiceSettings, useUploadStamp, useDeleteStamp } from '@/lib/hooks/useInvoiceSettings';
import { Button } from '@/components/ui';
import { Upload, Trash2, FileText } from 'lucide-react';
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
    const uploadStamp = useUploadStamp();
    const deleteStamp = useDeleteStamp();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const noteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [toggleSaved, setToggleSaved] = useState(false);

    const setting = data?.data;

    function handlePositionSelect(position: StampPosition) {
        updateSettings.mutate({ stamp_position: position });
    }

    function handlePrintExternalNotesToggle(checked: boolean) {
        updateSettings.mutate(
            { print_external_notes: checked },
            {
                onSuccess: () => {
                    setToggleSaved(true);
                    setTimeout(() => setToggleSaved(false), 1500);
                },
            }
        );
    }

    function handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const value = e.target.value;
        if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
        noteTimeoutRef.current = setTimeout(() => {
            updateSettings.mutate({ default_note: value || null });
        }, 600);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) uploadStamp.mutate(file);
    }

    function handlePreview() {
        window.open(invoiceSettingsApi.previewPdfUrl(), '_blank', 'noreferrer');
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Invoice Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">Configure stamp and default note for all invoices.</p>
            </div>

            {/* Stamp section */}
            <div className="border rounded-lg p-6 space-y-6">
                <h2 className="font-semibold text-lg">Company Stamp</h2>

                {/* Upload area */}
                <div className="flex items-start gap-4">
                    {setting?.stamp_url ? (
                        <div className="relative">
                            <img
                                src={setting.stamp_url}
                                alt="Company stamp"
                                className="w-24 h-24 object-contain border rounded-lg p-1"
                            />
                            <button
                                onClick={() => deleteStamp.mutate()}
                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary transition-colors"
                        >
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground text-center">PNG/JPG<br />max 2MB</span>
                        </div>
                    )}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Stamp image</p>
                        <p className="text-xs text-muted-foreground">Transparent PNG recommended. Displayed on all invoice pages.</p>
                        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
                        {!setting?.stamp_url && (
                            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-3 w-3 mr-1" /> Upload
                            </Button>
                        )}
                    </div>
                </div>

                {/* Position picker — 3x3 grid with gaps */}
                <div className="space-y-3">
                    <p className="text-sm font-medium">Stamp position on invoice</p>
                    <div className="border rounded-lg overflow-hidden" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gap: '1px', background: '#e5e7eb', maxWidth: '240px' }}>
                        {/* Top row filler for top-center gap */}
                        <div style={{ gridColumn: 2, gridRow: 1 }} className="bg-background" />
                        {/* Bottom row filler for bottom-center gap */}
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
                    <p className="text-xs text-muted-foreground">Changes save automatically. Stamp appears on every page.</p>
                </div>

                <Button variant="outline" size="sm" onClick={handlePreview}>
                    <FileText className="h-4 w-4 mr-2" />
                    Preview PDF
                </Button>
            </div>

            {/* Default Note section */}
            <div className="border rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-lg">Default Invoice Note</h2>
                <p className="text-sm text-muted-foreground">Pre-filled in the Note field for every new invoice. Editable per invoice.</p>
                <div className="flex items-center justify-between py-2 border-b border-border mb-4">
                    <div>
                        <p className="text-sm font-medium">Print external notes on PDF</p>
                        <p className="text-xs text-muted-foreground">When enabled, external notes appear on printed invoices.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {toggleSaved && <span className="text-xs text-green-600">Saved</span>}
                        <button
                            role="switch"
                            aria-checked={setting?.print_external_notes ?? true}
                            onClick={() => handlePrintExternalNotesToggle(!(setting?.print_external_notes ?? true))}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                (setting?.print_external_notes ?? true) ? 'bg-primary' : 'bg-muted-foreground/30'
                            }`}
                        >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                (setting?.print_external_notes ?? true) ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                        </button>
                    </div>
                </div>
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
