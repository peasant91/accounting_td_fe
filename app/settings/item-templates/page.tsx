'use client';

import { useState, useEffect, useRef } from 'react';
import { itemTemplatesApi } from '@/lib/api';
import { ItemTemplate } from '@/types';
import { Button, Input, LoadingState, ErrorState } from '@/components/ui';

export default function ItemTemplatesPage() {
    const [templates, setTemplates] = useState<ItemTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Add state
    const [addName, setAddName] = useState('');
    const [adding, setAdding] = useState(false);

    // Edit state: which row is being edited
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await itemTemplatesApi.list();
            setTemplates(res.data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // Focus edit input when edit starts
    useEffect(() => {
        if (editingId !== null) {
            editInputRef.current?.focus();
        }
    }, [editingId]);

    const handleAdd = async () => {
        const name = addName.trim();
        if (!name) return;
        setAdding(true);
        try {
            await itemTemplatesApi.create({ name });
            setAddName('');
            await load();
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (template: ItemTemplate) => {
        setEditingId(template.id);
        setEditName(template.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const handleEditSave = async () => {
        if (editingId === null) return;
        const name = editName.trim();
        if (!name) return;
        try {
            await itemTemplatesApi.update(editingId, { name });
            setEditingId(null);
            setEditName('');
            await load();
        } catch {
            // keep edit mode open on error
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await itemTemplatesApi.remove(id);
            await load();
        } catch {
            // silent — list will reload unchanged
        }
    };

    if (loading) return <LoadingState message="Loading item templates..." />;
    if (error) return <ErrorState title="Error loading item templates" />;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold">Item Templates</h1>
                <p className="text-muted-foreground mt-1">
                    Manage autocomplete suggestions for invoice line item descriptions.
                </p>
            </header>

            {/* Add new template */}
            <div className="rounded-lg border border-border bg-card p-4 flex items-end gap-3">
                <div className="flex-1">
                    <Input
                        label="New template name"
                        placeholder="e.g. Web Development Services"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAdd();
                        }}
                    />
                </div>
                <Button onClick={handleAdd} disabled={!addName.trim() || adding}>
                    {adding ? 'Saving…' : 'Add Template'}
                </Button>
            </div>

            {/* Templates table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                {templates.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                        No item templates yet. Add one above.
                    </p>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted/50 text-left text-sm">
                            <tr>
                                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 w-40"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {templates.map((t) =>
                                editingId === t.id ? (
                                    <tr key={t.id}>
                                        <td className="px-4 py-2">
                                            <Input
                                                ref={editInputRef}
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleEditSave();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                                className="w-full"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" onClick={handleEditSave} disabled={!editName.trim()}>
                                                    Save
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={t.id}>
                                        <td className="px-4 py-3 text-sm">{t.name}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(t.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
