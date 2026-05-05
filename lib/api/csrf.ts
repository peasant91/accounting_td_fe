const SANCTUM_URL = process.env.NEXT_PUBLIC_SANCTUM_URL || 'http://localhost:8000';

let csrfFetched = false;

export async function ensureCsrf(): Promise<void> {
    if (csrfFetched) return;
    const res = await fetch(`${SANCTUM_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error(`CSRF fetch failed: ${res.status}`);
    }
    csrfFetched = true;
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
}

export function xsrfHeader(): Record<string, string> {
    const token = getCookie('XSRF-TOKEN');
    return token ? { 'X-XSRF-TOKEN': token } : {};
}

export function resetCsrf(): void {
    csrfFetched = false;
}
