import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface MissingRatesWarningProps {
    currencies: string[];
}

export function MissingRatesWarning({ currencies }: MissingRatesWarningProps) {
    if (currencies.length === 0) return null;

    return (
        <div className="flex items-start gap-3 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
                No exchange rate set for{' '}
                <strong>{currencies.join(', ')}</strong>. Receivables in
                {currencies.length > 1 ? ' those currencies' : ' this currency'} are excluded from the base-currency total.
            </div>
            <Link href="/settings/exchange-rates" className="font-semibold hover:underline">
                Set rates →
            </Link>
        </div>
    );
}
