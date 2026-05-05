'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as auditApi from '@/lib/api/audit';
import { LoginAttempt } from '@/types';
import { LoginAttemptsFilters } from './LoginAttemptsFilters';

function detectBursts(rows: LoginAttempt[]): Set<number> {
    // Burst = 3+ failed attempts from same IP within 5 minutes. Flag all rows in such bursts.
    const burstIds = new Set<number>();
    const byIp = new Map<string, LoginAttempt[]>();
    rows.filter(r => !r.successful).forEach(r => {
        const list = byIp.get(r.ip_address) ?? [];
        list.push(r);
        byIp.set(r.ip_address, list);
    });
    byIp.forEach(list => {
        list.sort((a, b) => +new Date(a.attempted_at) - +new Date(b.attempted_at));
        for (let i = 0; i < list.length; i++) {
            const windowStart = +new Date(list[i].attempted_at);
            const inWindow = list.filter(r => {
                const t = +new Date(r.attempted_at);
                return t >= windowStart && t <= windowStart + 5 * 60 * 1000;
            });
            if (inWindow.length >= 3) inWindow.forEach(r => burstIds.add(r.id));
        }
    });
    return burstIds;
}

export function LoginAttemptsTable() {
    const [filters, setFilters] = useState<auditApi.LoginAttemptFilters>({});
    const { data, isLoading } = useQuery({
        queryKey: ['login-attempts', filters],
        queryFn: () => auditApi.getLoginAttempts(filters),
    });
    const bursts = useMemo(() => detectBursts(data?.data ?? []), [data]);

    return (
        <div>
            <LoginAttemptsFilters value={filters} onChange={setFilters} />
            <div className="overflow-x-auto rounded border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-muted-foreground border-b bg-muted/20">
                            <th className="py-2 px-3">When</th>
                            <th>Email</th>
                            <th>IP</th>
                            <th>Result</th>
                            <th className="px-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Loading...</td></tr>}
                        {!isLoading && (data?.data ?? []).length === 0 && (
                            <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No attempts yet.</td></tr>
                        )}
                        {(data?.data ?? []).map(row => (
                            <tr key={row.id} className={`border-b ${row.successful ? '' : 'bg-destructive/5'}`}>
                                <td className="py-2 px-3 whitespace-nowrap">{new Date(row.attempted_at).toLocaleString()}</td>
                                <td>{row.email}</td>
                                <td className="font-mono text-xs">{row.ip_address}</td>
                                <td>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        row.successful ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive'
                                    }`}>
                                        {row.successful ? 'OK' : 'FAIL'}
                                    </span>
                                </td>
                                <td className="px-3">
                                    {bursts.has(row.id) && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
                                            burst
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
