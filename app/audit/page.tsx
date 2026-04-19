'use client';
import Link from 'next/link';
import { ActivityTable } from '@/components/audit/ActivityTable';

export default function AuditActivityPage() {
    return (
        <div className="space-y-4 p-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Audit log — Activity</h1>
                <Link href="/audit/login-attempts" className="text-sm underline">Login attempts →</Link>
            </header>
            <ActivityTable />
        </div>
    );
}
