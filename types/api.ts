// API types

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
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
