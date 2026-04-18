'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CronSilentBannerProps {
    lastRunAt: string | null;
}

export function CronSilentBanner({ lastRunAt }: CronSilentBannerProps) {
    const dismissKey = `cronSilentBanner.dismissedOn.${new Date().toDateString()}`;
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        setDismissed(typeof window !== 'undefined' && localStorage.getItem(dismissKey) === '1');
    }, [dismissKey]);

    if (dismissed) return null;

    const handleDismiss = () => {
        localStorage.setItem(dismissKey, '1');
        setDismissed(true);
    };

    const lastRunCopy = lastRunAt
        ? `hasn't run since ${formatDate(lastRunAt)}`
        : 'has never been recorded as running';

    return (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
                <div className="font-semibold">Recurring invoice cron {lastRunCopy}.</div>
                <div className="text-destructive/80 mt-0.5">
                    Check <code className="rounded bg-destructive/10 px-1 py-0.5 text-xs">invoices:process-recurring</code> on the server.
                </div>
            </div>
            <button onClick={handleDismiss} className="rounded p-1 hover:bg-destructive/10" aria-label="Dismiss">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
