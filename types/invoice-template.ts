export type InvoiceComponentKey =
    | 'company_header'
    | 'invoice_meta'
    | 'customer_details'
    | 'sender_details'
    | 'total_summary_box'
    | 'line_items'
    | 'grand_total'
    | 'bank_transfer'
    | 'transfer_fee_note'
    | 'invoice_digits_note'
    | 'unique_number';

export interface InvoiceComponentConfig {
    key: InvoiceComponentKey;
    label: string;
    enabled: boolean;
    required: boolean;
}

export interface ResolvedLocale {
    language: string;
    locale: string;
    labels: Record<string, string>;
}

export interface InvoiceTemplate {
    id: number | null;
    customer_id: number;
    components: InvoiceComponentConfig[];
    resolved_locale: ResolvedLocale;
    created_at: string | null;
    updated_at: string | null;
}

export interface InvoiceTemplateFormData {
    components: Array<{ key: InvoiceComponentKey; enabled: boolean }>;
}

export interface SampleInvoice {
    invoice_number: string;
    invoice_date: string;
    customer_name: string;
    company_name: string;
    sender: {
        company_name: string;
        address: string;
        phone: string;
        email: string;
        npwp?: string;
    };
    items: Array<{
        description: string;
        quantity?: number;
        unit_price?: number;
        amount: number;
    }>;
    total: number;
    currency: string;
    bank_info: {
        bank_name: string;
        swift_code: string;
        account_name: string;
        account_number: string;
    };
}

export interface InvoicePreviewData {
    template: InvoiceTemplate;
    locale: ResolvedLocale;
    sample_invoice: SampleInvoice;
}
