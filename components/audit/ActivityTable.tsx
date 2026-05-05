'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as auditApi from '@/lib/api/audit';
import { ActivityLogEntry } from '@/types';
import { ActivityFilters as FiltersUI } from './ActivityFilters';

export function ActivityTable() {
    const [filters, setFilters] = useState<auditApi.ActivityFilters>({});
    const [selected, setSelected] = useState<ActivityLogEntry | null>(null);
    const { data, isLoading } = useQuery({
        queryKey: ['audit-activity', filters],
        queryFn: () => auditApi.getActivity(filters),
    });

    return (
        <div>
            <FiltersUI value={filters} onChange={setFilters} />
            <div className="overflow-x-auto rounded border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-muted-foreground border-b bg-muted/20">
                            <th className="py-2 px-3">When</th>
                            <th>Who</th>
                            <th>Action</th>
                            <th>Target</th>
                            <th className="px-3">IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Loading...</td></tr>}
                        {!isLoading && (data?.data ?? []).length === 0 && (
                            <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No activity yet.</td></tr>
                        )}
                        {(data?.data ?? []).map(row => (
                            <tr key={row.id} className="border-b cursor-pointer hover:bg-muted/40" onClick={() => setSelected(row)}>
                                <td className="py-2 px-3 whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</td>
                                <td>{row.user?.name ?? <span className="text-muted-foreground">—</span>}</td>
                                <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.action}</code></td>
                                <td>{row.loggable_type ? `${row.loggable_type.split('\\').pop()}#${row.loggable_id}` : <span className="text-muted-foreground">—</span>}</td>
                                <td className="px-3 text-xs font-mono">{row.ip_address ?? <span className="text-muted-foreground">—</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative bg-background w-full max-w-lg h-full overflow-auto p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
                        <header className="mb-4">
                            <h2 className="text-lg font-semibold font-mono">{selected.action}</h2>
                        </header>
                        <dl className="space-y-3 text-sm">
                            <div><dt className="text-muted-foreground">Who</dt><dd>{selected.user?.email ?? '—'}</dd></div>
                            <div><dt className="text-muted-foreground">When</dt><dd>{new Date(selected.created_at).toLocaleString()}</dd></div>
                            <div><dt className="text-muted-foreground">IP / User-Agent</dt><dd className="font-mono text-xs break-all">{selected.ip_address ?? '—'}<br />{selected.user_agent ?? '—'}</dd></div>
                            <div>
                                <dt className="text-muted-foreground mb-1">Properties</dt>
                                <dd><pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">{JSON.stringify(selected.properties, null, 2)}</pre></dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}
        </div>
    );
}
