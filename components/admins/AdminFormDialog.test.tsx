import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminFormDialog } from './AdminFormDialog';

function wrap(ui: React.ReactElement) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('AdminFormDialog', () => {
    it('create mode requires password', () => {
        wrap(<AdminFormDialog mode={{ kind: 'create' }} open={true} onOpenChange={() => {}} />);
        const pwd = screen.getByLabelText(/password/i) as HTMLInputElement;
        expect(pwd.required).toBe(true);
    });

    it('edit mode password optional with helper', () => {
        wrap(<AdminFormDialog mode={{ kind: 'edit', admin: { id: 1, name: 'A', email: 'a@b.com', role: 'admin', created_at: '', updated_at: '' } }} open={true} onOpenChange={() => {}} />);
        const pwd = screen.getByLabelText(/password/i) as HTMLInputElement;
        expect(pwd.required).toBe(false);
        expect(screen.getByText(/leave blank/i)).toBeInTheDocument();
    });
});
