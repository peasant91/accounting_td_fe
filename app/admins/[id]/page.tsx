'use client';
import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as adminsApi from '@/lib/api/admins';
import { useAuth } from '@/lib/auth';
import { AdminFormDialog } from '@/components/admins/AdminFormDialog';

export default function AdminEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [open, setOpen] = useState(true);

    const { data } = useQuery({
        queryKey: ['admin', id],
        queryFn: () => adminsApi.getAdmin(Number(id)),
        enabled: !!user && user.role === 'super_admin',
    });

    if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
    if (!user) return null;
    if (user.role !== 'super_admin') {
        return <div className="p-6 text-sm text-destructive">Forbidden.</div>;
    }
    if (!data) return <div className="p-6">Loading admin...</div>;

    return (
        <AdminFormDialog
            mode={{ kind: 'edit', admin: data.data }}
            open={open}
            onOpenChange={o => { setOpen(o); if (!o) router.push('/admins'); }}
        />
    );
}
