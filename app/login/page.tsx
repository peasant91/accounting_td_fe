import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                <header className="text-center space-y-1">
                    <h1 className="text-2xl font-semibold">Sign in</h1>
                    <p className="text-sm text-muted-foreground">Internal accounting dashboard</p>
                </header>
                <Suspense>
                    <LoginForm />
                </Suspense>
            </div>
        </main>
    );
}
