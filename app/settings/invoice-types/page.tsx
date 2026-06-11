'use client';

import { useState } from 'react';
import { useInvoiceTypes, useCreateInvoiceType, useUpdateInvoiceType } from '@/lib/hooks/useInvoiceTypes';
import { Button, Input } from '@/components/ui';
import { Plus, Pencil, Check, X } from 'lucide-react';

export default function InvoiceTypesPage() {
    const { data, isLoading } = useInvoiceTypes();
    const createType = useCreateInvoiceType();
    const updateType = useUpdateInvoiceType();

    const [showForm, setShowForm] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const types = data?.data ?? [];

    function handleCreate() {
        if (!newCode || !newName) return;
        createType.mutate(
            { code: newCode, name: newName },
            {
                onSuccess: () => {
                    setNewCode('');
                    setNewName('');
                    setShowForm(false);
                },
            }
        );
    }

    function handleToggleActive(id: number, current: boolean) {
        updateType.mutate({ id, data: { is_active: !current } });
    }

    function handleEditSave(id: number) {
        updateType.mutate({ id, data: { name: editName } }, {
            onSuccess: () => setEditingId(null),
        });
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Invoice Types</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage invoice type codes and names. Each type has its own number sequence.</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Type
                </Button>
            </div>

            {showForm && (
                <div className="border rounded-lg p-4 space-y-3">
                    <h3 className="font-medium">New Invoice Type</h3>
                    <div className="flex gap-3">
                        <Input
                            placeholder="Code (e.g. 005)"
                            value={newCode}
                            onChange={e => setNewCode(e.target.value)}
                            maxLength={3}
                            className="w-32"
                        />
                        <Input
                            placeholder="Name (e.g. Design)"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="flex-1"
                        />
                        <Button onClick={handleCreate} disabled={createType.isPending}>Save</Button>
                        <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            <div className="border rounded-lg divide-y">
                {types.length === 0 && (
                    <div className="px-4 py-8 text-center text-muted-foreground text-sm">No invoice types yet.</div>
                )}
                {types.map(type => (
                    <div key={type.id} className="flex items-center gap-4 p-4">
                        <span className="font-mono text-sm font-semibold text-muted-foreground w-12">{type.code}</span>
                        {editingId === type.id ? (
                            <div className="flex items-center gap-2 flex-1">
                                <Input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="h-8"
                                />
                                <Button size="icon" variant="ghost" onClick={() => handleEditSave(type.id)}>
                                    <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <span className="flex-1 font-medium">{type.name}</span>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => { setEditingId(type.id); setEditName(type.name); }}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <button
                            onClick={() => handleToggleActive(type.id, type.is_active)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${type.is_active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${type.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
