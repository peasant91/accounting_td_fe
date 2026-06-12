export type StampPosition =
    | 'top_left' | 'top_right'
    | 'center_left' | 'center_right' | 'center'
    | 'bottom_left' | 'bottom_right';

export interface InvoiceSetting {
    id: number;
    stamp_path: string | null;
    stamp_url: string | null;
    stamp_position: StampPosition | null;
    default_note: string | null;
    print_external_notes: boolean;
}

export interface InvoiceSettingUpdateData {
    stamp_position?: StampPosition | null;
    default_note?: string | null;
    print_external_notes?: boolean;
}
