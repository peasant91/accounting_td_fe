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
    | 'unique_number'
    | 'external_notes';

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

export type StampPosition =
    | 'top_left' | 'top_right'
    | 'center_left' | 'center_right' | 'center'
    | 'bottom_left' | 'bottom_right';

export interface InvoiceTemplate {
    id: number | null;
    customer_id: number;
    components: InvoiceComponentConfig[];
    stamp_position: StampPosition | null;
    resolved_locale: ResolvedLocale;
    created_at: string | null;
    updated_at: string | null;
}

export interface InvoiceTemplateFormData {
    components: Array<{ key: InvoiceComponentKey; enabled: boolean }>;
    stamp_position?: StampPosition | null;
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
