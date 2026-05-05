'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AdminsTable } from '@/components/admins/AdminsTable';
import { AdminFormDialog } from '@/components/admins/AdminFormDialog';
import { DeleteAdminDialog } from '@/components/admins/DeleteAdminDialog';
import { Button } from '@/components/ui/button';

export default function AdminsPage() {
    const { user, isLoading } = useAuth();
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
    if (!user) return null;
    if (user.role !== 'super_admin') {
        return <div className="p-6 text-sm text-destructive">You don&apos;t have permission to view this page.</div>;
    }

    return (
        <div className="space-y-4 p-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Admins</h1>
                <Button onClick={() => setCreateOpen(true)}>Create admin</Button>
            </header>
            <AdminsTable onDelete={setDeleteId} />
            <AdminFormDialog
                mode={{ kind: 'create' }}
                open={createOpen}
                onOpenChange={setCreateOpen}
            />
            <DeleteAdminDialog
                adminId={deleteId}
                open={deleteId !== null}
                onOpenChange={o => { if (!o) setDeleteId(null); }}
            />
        </div>
    );
}
