export type ImportRowStatus = 'ok' | 'skipped' | 'error';

export interface ImportRowResult {
    row: number;
    status: ImportRowStatus;
    invoice_number: string;
    customer: string;
    type: string;
    message: string;
}

export interface ImportResults {
    ok: ImportRowResult[];
    skipped: ImportRowResult[];
    error: ImportRowResult[];
}
