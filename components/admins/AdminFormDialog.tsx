'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminsApi from '@/lib/api/admins';
import { Admin } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

type Mode = { kind: 'create' } | { kind: 'edit'; admin: Admin };

export function AdminFormDialog({
    mode, open, onOpenChange,
}: {
    mode: Mode; open: boolean; onOpenChange: (o: boolean) => void;
}) {
    const qc = useQueryClient();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'super_admin' | 'admin' | 'sales'>('admin');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (mode.kind === 'edit') {
            setName(mode.admin.name);
            setEmail(mode.admin.email);
            setRole(mode.admin.role);
            setPassword('');
        } else {
            setName(''); setEmail(''); setPassword(''); setRole('admin');
        }
        setError(null);
    }, [mode, open]);

    const mutation = useMutation({
        mutationFn: async () => {
            if (mode.kind === 'create') {
                return adminsApi.createAdmin({ name, email, password, role });
            } else {
                const payload: Record<string, unknown> = { name, email, role };
                if (password) payload.password = password;
                return adminsApi.updateAdmin(mode.admin.id, payload);
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admins'] });
            onOpenChange(false);
        },
        onError: (e: { message?: string; errors?: Record<string, string[]> }) => {
            if (e.errors) {
                const first = Object.values(e.errors)[0]?.[0];
                setError(first || 'Validation error');
            } else {
                setError(e.message || 'Error');
            }
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {mode.kind === 'create' ? 'Create admin' : 'Edit admin'}
                    </DialogTitle>
                </DialogHeader>
                <form
                    id="admin-form"
                    onSubmit={e => { e.preventDefault(); mutation.mutate(); }}
                    className="space-y-3"
                >
                    <div className="space-y-1">
                        <Label htmlFor="admin-name">Name</Label>
                        <Input id="admin-name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="admin-email">Email</Label>
                        <Input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="admin-password">
                            Password{' '}
                            {mode.kind === 'edit' && (
                                <span className="text-xs text-muted-foreground ml-1">(leave blank to keep current)</span>
                            )}
                        </Label>
                        <Input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required={mode.kind === 'create'}
                            minLength={12}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="admin-role">Role</Label>
                        <select
                            id="admin-role"
                            value={role}
                            onChange={e => setRole(e.target.value as 'super_admin' | 'admin' | 'sales')}
                            className="border rounded px-3 py-2 w-full bg-background"
                        >
                            <option value="admin">admin</option>
                            <option value="super_admin">super_admin</option>
                            <option value="sales">sales</option>
                        </select>
                    </div>
                    {error && (
                        <p className="text-sm text-destructive" role="alert">{error}</p>
                    )}
                </form>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="admin-form" disabled={mutation.isPending}>
                        {mode.kind === 'create' ? 'Create' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
