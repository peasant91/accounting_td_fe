import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityTable } from './ActivityTable';

vi.mock('@/lib/api/audit', () => ({
    getActivity: vi.fn().mockResolvedValue({
        data: [{
            id: 1,
            action: 'invoice.created',
            user: { id: 1, name: 'Alice', email: 'a@x.com' },
            loggable_type: 'App\\Models\\Invoice',
            loggable_id: 42,
            properties: { note: 'hello' },
            ip_address: '1.2.3.4',
            user_agent: 'test',
            created_at: new Date().toISOString(),
        }],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
        links: { first: '', last: '', prev: null, next: null },
    }),
}));

function wrap(ui: React.ReactElement) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('ActivityTable', () => {
    it('renders rows and opens drawer on click', async () => {
        wrap(<ActivityTable />);
        const row = await screen.findByText('invoice.created');
        await userEvent.click(row);
        expect(await screen.findByText(/"note": "hello"/)).toBeInTheDocument();
    });
});
