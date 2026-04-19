'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActivityFilters as Filters } from '@/lib/api/audit';

export function ActivityFilters({ value, onChange }: {
    value: Filters; onChange: (f: Filters) => void;
}) {
    const update = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="space-y-1">
                <Label>Action</Label>
                <Input value={value.action ?? ''} onChange={e => update({ action: e.target.value })} placeholder="e.g. invoice.created" />
            </div>
            <div className="space-y-1">
                <Label>User ID</Label>
                <Input type="number" value={value.user_id ?? ''} onChange={e => update({ user_id: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="space-y-1">
                <Label>Date from</Label>
                <Input type="date" value={value.date_from ?? ''} onChange={e => update({ date_from: e.target.value })} />
            </div>
            <div className="space-y-1">
                <Label>Date to</Label>
                <Input type="date" value={value.date_to ?? ''} onChange={e => update({ date_to: e.target.value })} />
            </div>
            <div className="space-y-1 col-span-full">
                <Label>Search</Label>
                <Input value={value.search ?? ''} onChange={e => update({ search: e.target.value })} placeholder="Search properties, ip..." />
            </div>
        </div>
    );
}
