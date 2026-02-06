// Formatting utilities

/**
 * Format a number as currency.
 */
export function formatCurrency(amount: number, currency = 'IDR', locale?: string): string {
    const finalLocale = locale || getLocaleForCurrency(currency);
    return new Intl.NumberFormat(finalLocale, {
        style: 'currency',
        currency,
        minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
}

function getLocaleForCurrency(currency: string): string {
    switch (currency) {
        case 'IDR': return 'id-ID';
        case 'USD': return 'en-US';
        case 'JPY': return 'ja-JP';
        case 'AUD': return 'en-AU';
        case 'SGD': return 'en-SG';
        default: return 'en-US';
    }
}

/**
 * Format a date string.
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
        ...options,
    });
}

/**
 * Format a date for input fields (YYYY-MM-DD).
 */
export function formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
export function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Format a relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return formatDate(dateString);
}
