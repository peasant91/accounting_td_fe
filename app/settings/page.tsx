'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(false);

    return (
        <div className="space-y-6 p-6">
            <header>
                <h1 className="text-2xl font-semibold">Settings</h1>
            </header>

            <section className="space-y-3">
                <h2 className="text-lg font-medium">Sub-pages</h2>
                <ul className="space-y-1 text-sm">
                    <li><Link href="/settings/exchange-rates" className="underline">Exchange rates</Link></li>
                    <li><Link href="/settings/item-templates" className="underline">Item templates</Link></li>
                </ul>
            </section>

            <section className="space-y-2 border-t pt-6">
                <h2 className="text-lg font-medium">Sessions</h2>
                <p className="text-sm text-muted-foreground">
                    Sign out of this browser and every other active session for your account.
                </p>
                <Button variant="destructive" disabled={loading} onClick={async () => {
                    setLoading(true);
                    try { await logout(true); } finally { setLoading(false); }
                }}>
                    Sign out everywhere
                </Button>
            </section>
        </div>
    );
}
