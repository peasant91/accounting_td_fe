import styles from './StatusBadge.module.css';
import { InvoiceStatus } from '@/types';

interface StatusBadgeProps {
    status: InvoiceStatus | 'active' | 'inactive';
}

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    active: 'Active',
    inactive: 'Inactive',
};

export function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <span className={`${styles.badge} ${styles[status]}`}>
            {statusLabels[status] || status}
        </span>
    );
}
