import Link from 'next/link';
import { Button } from '@/components/ui';
import styles from './Dashboard.module.css';

export function QuickActions() {
    return (
        <div className={styles.quickActions}>
            <Link href="/customers/new">
                <Button variant="primary">
                    <span className={styles.actionIcon}>+</span> New Customer
                </Button>
            </Link>
            <Link href="/invoices/new">
                <Button variant="primary">
                    <span className={styles.actionIcon}>+</span> New Invoice
                </Button>
            </Link>
        </div>
    );
}
