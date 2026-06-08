'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function QuickActions() {
    const { user } = useAuth();
    const isSales = user?.role === 'sales';

    return (
        <div className="flex gap-3">
            <Link href="/customers/new">
                <Button>
                    <Plus className="h-4 w-4" />
                    New Customer
                </Button>
            </Link>
            {!isSales && (
                <Link href="/invoices/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        New Invoice
                    </Button>
                </Link>
            )}
        </div>
    );
}
