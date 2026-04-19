'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginAttemptFilters as Filters } from '@/lib/api/audit';

export function LoginAttemptsFilters({ value, onChange }: {
    value: Filters; onChange: (f: Filters) => void;
}) {
    const update = (p: Partial<Filters>) => onChange({ ...value, ...p });
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="space-y-1"><Label>Email</Label><Input value={value.email ?? ''} onChange={e => update({ email: e.target.value })} /></div>
            <div className="space-y-1"><Label>IP</Label><Input value={value.ip ?? ''} onChange={e => update({ ip: e.target.value })} /></div>
            <div className="space-y-1">
                <Label>Result</Label>
                <select value={value.successful === undefined ? '' : String(value.successful)}
                        onChange={e => update({ successful: e.target.value === '' ? undefined : e.target.value === 'true' })}
                        className="border rounded px-3 py-2 w-full bg-background">
                    <option value="">All</option>
                    <option value="true">Success</option>
                    <option value="false">Failed</option>
                </select>
            </div>
            <div className="space-y-1"><Label>Date from</Label><Input type="date" value={value.date_from ?? ''} onChange={e => update({ date_from: e.target.value })} /></div>
        </div>
    );
}
