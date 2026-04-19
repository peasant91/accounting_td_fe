'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminsApi from '@/lib/api/admins';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

export function DeleteAdminDialog({
    adminId, open, onOpenChange,
}: {
    adminId: number | null; open: boolean; onOpenChange: (o: boolean) => void;
}) {
    const qc = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { if (!open) setError(null); }, [open]);

    const mutation = useMutation({
        mutationFn: () => adminsApi.deleteAdmin(adminId!),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admins'] });
            onOpenChange(false);
        },
        onError: (e: { message?: string; errors?: Record<string, string[]> }) => {
            const msg = e.errors ? Object.values(e.errors)[0]?.[0] : e.message;
            setError(msg || 'Unable to delete.');
        },
    });

    return (
        <Dialog open={open && adminId !== null} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete admin?</DialogTitle>
                    <DialogDescription>
                        This cannot be undone. The admin will lose access immediately.
                    </DialogDescription>
                </DialogHeader>
                {error && (
                    <p className="text-sm text-destructive" role="alert">{error}</p>
                )}
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
