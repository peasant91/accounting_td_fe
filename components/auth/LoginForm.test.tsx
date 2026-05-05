import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { AuthContext } from '@/lib/auth/AuthProvider';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

function renderWithAuth(login: (e: string, p: string) => Promise<void>) {
    return render(
        <AuthContext.Provider value={{ user: null, isLoading: false, login, logout: async () => {}, refresh: async () => {} }}>
            <LoginForm />
        </AuthContext.Provider>
    );
}

describe('LoginForm', () => {
    it('submits credentials', async () => {
        const login = vi.fn().mockResolvedValue(undefined);
        renderWithAuth(login);
        await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'secret-password-12');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        expect(login).toHaveBeenCalledWith('a@b.com', 'secret-password-12');
    });

    it('shows 401 error', async () => {
        const login = vi.fn().mockRejectedValue({ status: 401 });
        renderWithAuth(login);
        await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        expect(await screen.findByRole('alert')).toHaveTextContent(/invalid/i);
    });

    it('shows 429 retry message', async () => {
        const login = vi.fn().mockRejectedValue({ status: 429 });
        renderWithAuth(login);
        await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'whatever');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        expect(await screen.findByRole('alert')).toHaveTextContent(/too many/i);
    });
});
