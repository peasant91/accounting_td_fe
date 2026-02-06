'use client';

import styles from './Layout.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/customers', label: 'Customers', icon: '👥' },
    { href: '/invoices', label: 'Invoices', icon: '📄' },
];

export function Layout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>💼</span>
                    <span className={styles.logoText}>Accounting</span>
                </div>
                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className={styles.sidebarFooter}>
                    <p>© 2026 Timedoor</p>
                </div>
            </aside>
            <main className={styles.main}>{children}</main>
        </div>
    );
}
