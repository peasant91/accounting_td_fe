'use client';
import Link from 'next/link';
import { LoginAttemptsTable } from '@/components/audit/LoginAttemptsTable';

export default function LoginAttemptsPage() {
    return (
        <div className="space-y-4 p-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Audit log — Login attempts</h1>
                <Link href="/audit" className="text-sm underline">← Activity</Link>
            </header>
            <LoginAttemptsTable />
        </div>
    );
}
