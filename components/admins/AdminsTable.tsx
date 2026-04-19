'use client';
import { useQuery } from '@tanstack/react-query';
import * as adminsApi from '@/lib/api/admins';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AdminsTable({ onDelete }: { onDelete: (id: number) => void }) {
    const { data, isLoading } = useQuery({
        queryKey: ['admins'],
        queryFn: () => adminsApi.listAdmins(),
    });

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
    const rows = data?.data || [];

    if (rows.length === 0) {
        return <p className="text-sm text-muted-foreground">No admins yet.</p>;
    }

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2">Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(a => (
                    <tr key={a.id} className="border-b">
                        <td className="py-2">{a.name}</td>
                        <td>{a.email}</td>
                        <td>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                a.role === 'super_admin'
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                            }`}>
                                {a.role}
                            </span>
                        </td>
                        <td>{new Date(a.created_at).toLocaleDateString()}</td>
                        <td className="text-right space-x-2">
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/admins/${a.id}`}>Edit</Link>
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => onDelete(a.id)}>
                                Delete
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
