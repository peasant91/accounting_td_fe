import Link from 'next/link';
import styles from './Dashboard.module.css';

interface SummaryCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: React.ReactNode;
    accentClass: string;
    href?: string;
}

export function SummaryCard({ title, value, subValue, icon, accentClass, href }: SummaryCardProps) {
    const CardContent = (
        <>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statContent}>
                <span className={styles.statLabel}>{title}</span>
                <span className={styles.statValue}>{value}</span>
                {subValue && <span className={styles.statSubvalue}>{subValue}</span>}
            </div>
        </>
    );

    if (href) {
        return (
            <Link href={href} className={`${styles.statCard} ${accentClass} ${styles.clickable}`}>
                {CardContent}
            </Link>
        );
    }

    return (
        <div className={`${styles.statCard} ${accentClass}`}>
            {CardContent}
        </div>
    );
}
