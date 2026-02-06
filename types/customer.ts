// Customer types

import { Invoice } from './invoice';

export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    tax_id: string | null;
    notes: string | null;
    status: CustomerStatus;
    total_receivable: number;
    invoices?: Invoice[];
    created_at: string;
    updated_at: string;
}

export type CustomerStatus = 'active' | 'inactive';

export interface CustomerListItem {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    total_receivable: number;
    status: CustomerStatus;
}

export interface CustomerFormData {
    name: string;
    email: string;
    phone?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    tax_id?: string;
    notes?: string;
}

export interface CustomerListParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: CustomerStatus;
    sort_by?: 'name' | 'email' | 'created_at';
    sort_order?: 'asc' | 'desc';
}
