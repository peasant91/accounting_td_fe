// API types

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}

export interface SingleResponse<T> {
    data: T;
    message?: string;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

export interface ReceivablesBreakdownEntry {
    currency: string;
    amount: number;
    base_equivalent: number | null;
}

export interface ReceivablesSummary {
    base_currency: string;
    base_total: number;
    breakdown: ReceivablesBreakdownEntry[];
    rates_updated_at: string | null;
    missing_rates: string[];
}

export interface DashboardSummary {
    total_receivables: ReceivablesSummary;
    total_customers: number;
    invoices_due_this_month: {
        count: number;
        amount: number;
    };
    recurring_invoices: {
        generated_today: number;
        overdue_count: number;
        cron: {
            last_run_at: string | null;
            is_silent: boolean;
        };
        upcoming: {
            id: number;
            customer_id: number;
            customer_name: string;
            title: string;
            next_invoice_date: string;
        }[];
    };
    recent_activity: ActivityItem[];
}

export interface ActivityItem {
    id: number;
    action: string;
    description: string;
    created_at: string;
}

export type UserRole = 'super_admin' | 'admin';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

export interface Admin extends User {
    created_at: string;
    updated_at: string;
    last_login_at?: string | null;
}

export interface ActivityLogEntry {
    id: number;
    action: string;
    user: { id: number; name: string; email: string } | null;
    loggable_type: string | null;
    loggable_id: number | null;
    properties: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export interface LoginAttempt {
    id: number;
    email: string;
    user_id: number | null;
    ip_address: string;
    user_agent: string | null;
    successful: boolean;
    attempted_at: string;
}
