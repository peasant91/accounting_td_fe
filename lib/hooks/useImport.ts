'use client';

import { useState } from 'react';
import * as importApi from '@/lib/api/import';
import { ImportResults } from '@/types/import';

export function useImport() {
    const [results, setResults] = useState<ImportResults | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const preview = async (file: File) => {
        setIsPreviewing(true);
        setError(null);
        try {
            const data = await importApi.previewImport(file);
            setResults(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Preview failed');
        } finally {
            setIsPreviewing(false);
        }
    };

    const commit = async (file: File) => {
        setIsCommitting(true);
        setError(null);
        try {
            const data = await importApi.commitImport(file);
            setResults(data);
            return data;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Import failed');
            return null;
        } finally {
            setIsCommitting(false);
        }
    };

    const reset = () => {
        setResults(null);
        setError(null);
    };

    return { results, isPreviewing, isCommitting, error, preview, commit, reset };
}
