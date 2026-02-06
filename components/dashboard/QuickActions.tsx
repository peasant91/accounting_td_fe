import Link from 'next/link';
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export function QuickActions() {
    return (
        <div className="flex gap-3">
            <Link href="/customers/new">
                <Button>
                    <Plus className="h-4 w-4" />
                    New Customer
                </Button>
            </Link>
            <Link href="/invoices/new">
                <Button>
                    <Plus className="h-4 w-4" />
                    New Invoice
                </Button>
            </Link>
        </div>
    );
}
