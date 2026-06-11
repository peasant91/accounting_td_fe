export interface InvoiceType {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface InvoiceTypeRef {
    id: number;
    code: string;
    name: string;
}

export interface InvoiceTypeFormData {
    code: string;
    name: string;
}
