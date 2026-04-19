'use client';

import { createContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authApi from '@/lib/api/auth';
import { setUnauthorizedHandler } from '@/lib/api/client';
import { User } from '@/types';

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: (all?: boolean) => Promise<void>;
    refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const refresh = useCallback(async () => {
        try {
            const res = await authApi.getMe();
            setUser(res.data);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            setUser(null);
            if (pathname !== '/login') {
                router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            }
        });
        refresh();
        return () => setUnauthorizedHandler(null);
    }, [refresh, router, pathname]);

    const login = useCallback(async (email: string, password: string) => {
        await authApi.login(email, password);
        await refresh();
    }, [refresh]);

    const logout = useCallback(async (all = false) => {
        try { await authApi.logout(all); } finally {
            setUser(null);
            router.replace('/login');
        }
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}
