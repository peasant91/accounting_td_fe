'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useImport } from '@/lib/hooks/useImport';
import { templateUrl } from '@/lib/api/import';
import { ImportRowResult } from '@/types/import';
import { Upload, Download, CheckCircle } from 'lucide-react';

export default function ImportPage() {
    const { user, isLoading } = useAuth();
    const { results, isPreviewing, isCommitting, error, preview, commit, reset } = useImport();
    const [file, setFile] = useState<File | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
    if (!user) return null;
    if (user.role !== 'super_admin') {
        return <div className="p-6 text-sm text-destructive">You don&apos;t have permission to view this page.</div>;
    }

    const allRows: ImportRowResult[] = results
        ? [...results.ok, ...results.skipped, ...results.error].sort((a, b) => a.row - b.row)
        : [];

    const canCommit = results !== null && results.error.length === 0 && results.ok.length > 0;

    function handleFileChange(selected: File | null) {
        if (!selected) return;
        setFile(selected);
        setSuccessCount(null);
        reset();
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped?.name.endsWith('.csv')) handleFileChange(dropped);
    }

    async function handlePreview() {
        if (!file) return;
        await preview(file);
    }

    async function handleCommit() {
        if (!file) return;
        const data = await commit(file);
        if (data) {
            setSuccessCount(data.ok.length);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    function statusBadge(status: ImportRowResult['status']) {
        const classes = {
            ok: 'bg-green-100 text-green-800',
            skipped: 'bg-yellow-100 text-yellow-800',
            error: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes[status]}`}>
                {status}
            </span>
        );
    }

    function rowBg(status: ImportRowResult['status']) {
        return {
            ok: 'bg-green-50',
            skipped: 'bg-yellow-50',
            error: 'bg-red-50',
        }[status];
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Import Invoices</h1>
                    <p className="text-muted-foreground text-sm mt-1">Upload a CSV file to bulk-import invoices. Preview before committing.</p>
                </div>
                <a
                    href={templateUrl()}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                    <Download className="h-4 w-4" />
                    Download Template
                </a>
            </div>

            {/* Success banner */}
            {successCount !== null && (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span>Successfully imported {successCount} invoice{successCount !== 1 ? 's' : ''}.</span>
                </div>
            )}

            {/* Error alert */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
                    {error}
                </div>
            )}

            {/* File upload zone */}
            <div className="border rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-sm">Upload CSV</h2>
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                    }`}
                >
                    <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    {file ? (
                        <p className="text-sm font-medium">{file.name}</p>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">Drag &amp; drop a CSV file here, or click to browse</p>
                            <p className="text-xs text-muted-foreground mt-1">.csv files only</p>
                        </>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handlePreview}
                        disabled={!file || isPreviewing}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                    >
                        {isPreviewing ? 'Previewing...' : 'Preview'}
                    </button>
                    {results && (
                        <button
                            onClick={handleCommit}
                            disabled={!canCommit || isCommitting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                        >
                            {isCommitting ? 'Importing...' : 'Confirm Import'}
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            {results && (
                <div className="border rounded-lg space-y-4 overflow-hidden">
                    {/* Summary */}
                    <div className="flex items-center gap-6 p-4 border-b bg-muted/20 text-sm">
                        <span className="font-medium">Preview Results</span>
                        <span className="text-green-700 font-medium">{results.ok.length} ready</span>
                        <span className="text-yellow-700 font-medium">{results.skipped.length} skipped</span>
                        <span className="text-red-700 font-medium">{results.error.length} errors</span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left px-4 py-2 font-medium text-muted-foreground w-16">Row</th>
                                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Invoice #</th>
                                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Customer</th>
                                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                                    <th className="text-left px-4 py-2 font-medium text-muted-foreground w-24">Status</th>
                                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Message</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {allRows.map((row) => (
                                    <tr key={row.row} className={rowBg(row.status)}>
                                        <td className="px-4 py-2 font-mono text-muted-foreground">{row.row}</td>
                                        <td className="px-4 py-2 font-mono">{row.invoice_number || '—'}</td>
                                        <td className="px-4 py-2">{row.customer || '—'}</td>
                                        <td className="px-4 py-2">{row.type || '—'}</td>
                                        <td className="px-4 py-2">{statusBadge(row.status)}</td>
                                        <td className="px-4 py-2 text-muted-foreground">{row.message || '—'}</td>
                                    </tr>
                                ))}
                                {allRows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No rows found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
