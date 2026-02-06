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

export interface DashboardSummary {
    total_receivables: number;
    total_customers: number;
    invoices_due_this_month: {
        count: number;
        amount: number;
    };
    recent_activity: ActivityItem[];
}

export interface ActivityItem {
    id: number;
    action: string;
    description: string;
    created_at: string;
}
