'use client';

import { ReceivablesSummary } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface TotalReceivablesCardProps {
    data: ReceivablesSummary;
}

export function TotalReceivablesCard({ data }: TotalReceivablesCardProps) {
    const hasBreakdown = data.breakdown.length > 0;
    const isSingleCurrencyBase =
        data.breakdown.length === 1 && data.breakdown[0].currency === data.base_currency;

    const headline = isSingleCurrencyBase
        ? formatCurrency(data.base_total, data.base_currency)
        : `≈ ${formatCurrency(data.base_total, data.base_currency)}`;

    return (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Receivables
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground">{headline}</div>
            {!isSingleCurrencyBase && (
                <div className="text-sm text-muted-foreground">
                    {data.base_currency} equivalent
                    {data.rates_updated_at && (
                        <>
                            {' · rates updated '}
                            {formatRelativeTime(data.rates_updated_at)}
                        </>
                    )}
                </div>
            )}
            {hasBreakdown && !isSingleCurrencyBase && (
                <>
                    <div className="my-3 h-px bg-border" />
                    <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 text-sm text-foreground">
                        {data.breakdown.map((row) => (
                            <BreakdownRow key={row.currency} row={row} base={data.base_currency} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function BreakdownRow({
    row,
    base,
}: {
    row: ReceivablesSummary['breakdown'][number];
    base: string;
}) {
    const isBase = row.currency === base;
    return (
        <>
            <span>{row.currency}</span>
            <span className="text-right">{formatCurrency(row.amount, row.currency)}</span>
            <span className="text-muted-foreground">
                {isBase
                    ? '(native)'
                    : row.base_equivalent === null
                    ? '— no rate'
                    : `≈ ${formatCurrency(row.base_equivalent, base)}`}
            </span>
        </>
    );
}
