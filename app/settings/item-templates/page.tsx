'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { itemTemplatesApi } from '@/lib/api';
import { ItemTemplate } from '@/types';
import { Button, Input, LoadingState, ErrorState, EmptyState, Textarea } from '@/components/ui';

export default function ItemTemplatesPage() {
    const [templates, setTemplates] = useState<ItemTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [addName, setAddName] = useState('');
    const [addDescription, setAddDescription] = useState('');
    const [adding, setAdding] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const editInputRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
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
    }, []);

    useEffect(() => { load(); }, [load]);

    // Focus edit input when edit starts
    useEffect(() => {
        if (editingId !== null) {
            editInputRef.current?.focus();
        }
    }, [editingId]);

    const handleAdd = async () => {
        if (adding) return;
        const name = addName.trim();
        if (!name) return;
        setAdding(true);
        try {
            await itemTemplatesApi.create({ name, description: addDescription.trim() || undefined });
            setAddName('');
            setAddDescription('');
            toast.success('Template added');
            await load();
        } catch {
            toast.error('Failed to add template');
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (template: ItemTemplate) => {
        setEditingId(template.id);
        setEditName(template.name);
        setEditDescription(template.description ?? '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditDescription('');
    };

    const handleEditSave = async () => {
        if (saving) return;
        if (editingId === null) return;
        const name = editName.trim();
        if (!name) return;
        setSaving(true);
        try {
            await itemTemplatesApi.update(editingId, {
                name,
                description: editDescription.trim() || undefined,
            });
            setEditingId(null);
            setEditName('');
            setEditDescription('');
            toast.success('Template updated');
            await load();
        } catch {
            toast.error('Failed to update template');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await itemTemplatesApi.remove(id);
            toast.success('Template deleted');
            await load();
        } catch {
            toast.error('Failed to delete template');
        }
    };

    if (loading) return <LoadingState message="Loading item templates..." />;
    if (error) return <ErrorState title="Error loading item templates" action={{ label: 'Retry', onClick: load }} />;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold">Item Templates</h1>
                <p className="text-muted-foreground mt-1">
                    Manage autocomplete suggestions for invoice line item descriptions.
                </p>
            </header>

            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <Input
                            label="Name"
                            placeholder="e.g. Web Development Services"
                            value={addName}
                            onChange={(e) => setAddName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                        />
                    </div>
                    <Button onClick={handleAdd} disabled={!addName.trim() || adding}>
                        {adding ? 'Saving…' : 'Add Template'}
                    </Button>
                </div>
                <Textarea
                    label="Description (optional)"
                    placeholder="e.g. Monthly retainer for web development services"
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    rows={2}
                />
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
                {templates.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No item templates yet"
                        description="Add one above to get started."
                    />
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted/50 text-left text-sm">
                            <tr>
                                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 font-medium text-muted-foreground">Description</th>
                                <th className="px-4 py-3 w-40"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {templates.map((t) =>
                                editingId === t.id ? (
                                    <tr key={t.id}>
                                        <td className="px-4 py-2" colSpan={2}>
                                            <div className="space-y-2">
                                                <Input
                                                    ref={editInputRef}
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !saving) handleEditSave();
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                    className="w-full"
                                                />
                                                <Textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    placeholder="Description (optional)"
                                                    rows={2}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" onClick={handleEditSave} disabled={saving || !editName.trim()}>
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
                                        <td className="px-4 py-3 text-sm font-medium">{t.name}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-xs">
                                            {t.description ?? <span className="italic">—</span>}
                                        </td>
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
