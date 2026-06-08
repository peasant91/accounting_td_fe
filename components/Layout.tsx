'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, FileText, Menu, X, Settings, ClipboardList, Shield, LogOut, DollarSign, Tag, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/invoices', label: 'Invoices', icon: FileText },
];

const settingsItems = [
    { href: '/settings/exchange-rates', label: 'Exchange Rates', icon: DollarSign },
    { href: '/settings/item-templates', label: 'Item Templates', icon: Tag },
];

export function Layout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/settings'));
    const { user, logout } = useAuth();

    if (pathname === '/login') return <>{children}</>;

    return (
        <div className="flex min-h-screen">
            {/* Mobile menu button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-background border border-border shadow-sm print:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Sidebar */}
            <aside
                className={cn(
                    "w-60 bg-background border-r border-border flex flex-col fixed h-screen transition-transform lg:translate-x-0 z-40 print:hidden",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center gap-2 p-6 border-b border-border">
                    <span className="text-2xl">💼</span>
                    <span className="text-xl font-bold text-primary">Accounting</span>
                </div>
                <nav className="flex-1 p-4 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    {user?.role !== 'sales' && (
                        <>
                            {/* Settings group */}
                            <button
                                onClick={() => setSettingsOpen((o) => !o)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors w-full",
                                    pathname.startsWith('/settings')
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Settings className="h-5 w-5" />
                                <span className="flex-1 text-left">Settings</span>
                                <ChevronRight className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-90")} />
                            </button>
                            {settingsOpen && (
                                <div className="flex flex-col gap-1 pl-4">
                                    {settingsItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            <Link
                                href="/audit"
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                    pathname === '/audit'
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <ClipboardList className="h-5 w-5" />
                                <span>Audit Log</span>
                            </Link>
                        </>
                    )}
                    {user?.role === 'super_admin' && (
                        <Link
                            href="/admins"
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                pathname === '/admins'
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Shield className="h-5 w-5" />
                            <span>Admins</span>
                        </Link>
                    )}
                </nav>
                {user && (
                    <div className="p-4 border-t border-border flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                )}
                <div className="p-4 border-t border-border text-xs text-muted-foreground text-center">
                    © 2026 Timedoor
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main content */}
            <main className="flex-1 lg:ml-60 min-h-screen bg-muted/30 p-6 print:ml-0 print:p-0 print:bg-white">
                {children}
            </main>
        </div>
    );
}
