export function getTotalDue(invoice: {
    total: number;
    use_unique_code: boolean;
    unique_code: number | null;
}): number {
    return invoice.use_unique_code && invoice.unique_code != null
        ? invoice.total + invoice.unique_code
        : invoice.total;
}
