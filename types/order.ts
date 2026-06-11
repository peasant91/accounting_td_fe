import { InvoiceTypeRef } from './invoice-type';

export type OrderStatus = 'not_yet' | 'deposit_only' | 'payment_completed' | 'cancelled';

export interface Order {
    id: number;
    customer_id: number;
    customer: {
        id: number;
        company_name: string;
        currency: string;
    } | null;
    invoice_type_id: number | null;
    invoice_type: InvoiceTypeRef | null;
    title: string;
    total_price: string;
    deposit_amount: string | null;
    maintenance_price: string | null;
    status: OrderStatus;
    jp: string | null;
    source: string | null;
    sales_pic: string | null;
    date_of_contract: string | null;
    notes: string | null;
    total_paid: string;
    remaining_balance: string;
    invoices?: Array<{
        id: number;
        invoice_number: string;
        invoice_date: string | null;
        total: string;
        status: string;
        use_unique_code: boolean;
    }>;
    created_at: string;
    updated_at: string;
}

export interface OrderFormData {
    customer_id: number;
    invoice_type_id: number;
    title: string;
    total_price: number;
    deposit_amount?: number | null;
    maintenance_price?: number | null;
    jp?: string | null;
    source?: string | null;
    sales_pic?: string | null;
    date_of_contract?: string | null;
    notes?: string | null;
}

export interface OrderListParams {
    customer_id?: number;
    status?: OrderStatus;
    invoice_type_id?: number;
    sales_pic?: string;
    jp?: string;
    source?: string;
    page?: number;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    not_yet: 'Not Yet',
    deposit_only: 'Deposit Only',
    payment_completed: 'Payment Completed',
    cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    not_yet: 'bg-yellow-100 text-yellow-800',
    deposit_only: 'bg-blue-100 text-blue-800',
    payment_completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-600',
};
