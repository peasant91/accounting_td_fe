'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [retryAfter, setRetryAfter] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setRetryAfter(null);
        setLoading(true);
        try {
            await login(email, password);
            const next = params.get('next') || '/';
            router.replace(next);
        } catch (err: unknown) {
            const e = err as { status?: number; message?: string };
            if (e.status === 429) {
                setRetryAfter(60);
                setError('Too many login attempts. Please wait and try again.');
            } else if (e.status === 401) {
                setError('Invalid email or password.');
            } else {
                setError(e.message || 'Unable to sign in.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4 max-w-sm mx-auto">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required autoComplete="email" value={email}
                       onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required autoComplete="current-password" value={password}
                       onChange={e => setPassword(e.target.value)} disabled={loading} />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            {retryAfter && <p className="text-xs text-muted-foreground">Retry in ~{retryAfter}s</p>}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Sign in
            </Button>
        </form>
    );
}
