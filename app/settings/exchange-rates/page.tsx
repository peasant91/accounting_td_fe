'use client';

import { useState } from 'react';
import { useCurrencyRates, useUpsertCurrencyRate } from '@/lib/hooks';
import { Button, ErrorState, Input, LoadingState } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';

const CURRENCY_NAMES: Record<string, string> = {
    USD: 'US Dollar',
    JPY: 'Japanese Yen',
    SGD: 'Singapore Dollar',
    AUD: 'Australian Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
};

export default function ExchangeRatesPage() {
    const { data, isLoading, error } = useCurrencyRates();
    const upsert = useUpsertCurrencyRate();
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [newCurrency, setNewCurrency] = useState('');
    const [newRate, setNewRate] = useState('');

    if (isLoading) return <LoadingState message="Loading exchange rates..." />;
    if (error) return <ErrorState title="Error loading rates" />;

    const rates = data?.data ?? [];
    const base = data?.base_currency ?? 'IDR';

    const saveRow = async (currency: string) => {
        const raw = drafts[currency];
        if (raw === undefined) return;
        const value = Number(raw);
        if (!Number.isFinite(value) || value <= 0) return;
        await upsert.mutateAsync({ currency, rate_to_base: value });
        setDrafts((d) => {
            const { [currency]: _, ...rest } = d;
            return rest;
        });
    };

    const addNew = async () => {
        const code = newCurrency.trim().toUpperCase();
        const value = Number(newRate);
        if (!/^[A-Z]{3}$/.test(code)) return;
        if (!Number.isFinite(value) || value <= 0) return;
        await upsert.mutateAsync({ currency: code, rate_to_base: value });
        setNewCurrency('');
        setNewRate('');
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold">Exchange Rates</h1>
                <p className="text-muted-foreground mt-1">
                    Base currency: <strong>{base}</strong>. All invoice totals are converted to {base} on the dashboard using these rates.
                </p>
            </header>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50 text-left text-sm">
                        <tr>
                            <th className="px-4 py-3 font-medium text-muted-foreground">Currency</th>
                            <th className="px-4 py-3 font-medium text-muted-foreground text-right">1 unit =</th>
                            <th className="px-4 py-3 font-medium text-muted-foreground">Updated</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {rates.map((rate) => {
                            const draft = drafts[rate.currency];
                            const isDirty = draft !== undefined && draft !== String(rate.rate_to_base);
                            return (
                                <tr key={rate.currency}>
                                    <td className="px-4 py-3">
                                        <strong>{rate.currency}</strong>
                                        {CURRENCY_NAMES[rate.currency] && (
                                            <span className="text-muted-foreground"> · {CURRENCY_NAMES[rate.currency]}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={draft ?? String(rate.rate_to_base)}
                                            onChange={(e) =>
                                                setDrafts((d) => ({ ...d, [rate.currency]: e.target.value }))
                                            }
                                            className="w-40 text-right inline-block"
                                        />
                                        <span className="ml-2 text-muted-foreground">{base}</span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-sm">
                                        {rate.updated_at ? formatRelativeTime(rate.updated_at) : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button
                                            size="sm"
                                            disabled={!isDirty || upsert.isPending}
                                            onClick={() => saveRow(rate.currency)}
                                        >
                                            Save
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 flex items-end gap-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                        label="Currency code"
                        placeholder="USD"
                        value={newCurrency}
                        onChange={(e) => setNewCurrency(e.target.value)}
                    />
                    <Input
                        label={`Rate to ${base}`}
                        type="number"
                        placeholder="16250"
                        step="0.0001"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                    />
                </div>
                <Button onClick={addNew} disabled={!newCurrency || !newRate || upsert.isPending}>
                    Add currency
                </Button>
            </div>
        </div>
    );
}
