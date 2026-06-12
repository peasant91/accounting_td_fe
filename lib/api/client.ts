import { ensureCsrf, xsrfHeader, resetCsrf } from './csrf';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
    onUnauthorized = handler;
}

class ApiClient {
    constructor(private baseUrl: string) {}

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;
        const isFormData = body instanceof FormData;

        const requestHeaders: Record<string, string> = {
            Accept: 'application/json',
            ...headers,
        };
        if (!isFormData) requestHeaders['Content-Type'] = 'application/json';

        if (method !== 'GET') {
            await ensureCsrf();
            Object.assign(requestHeaders, xsrfHeader());
        }

        const config: RequestInit = {
            method,
            headers: requestHeaders,
            credentials: 'include',
        };
        if (body && method !== 'GET') {
            config.body = isFormData ? (body as FormData) : JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config);

        if (response.status === 401 && onUnauthorized) {
            onUnauthorized();
        }
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw { status: response.status, ...error };
        }
        if (response.status === 204) return {} as T;
        return response.json();
    }

    get<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'GET' }); }
    post<T>(endpoint: string, body?: unknown) { return this.request<T>(endpoint, { method: 'POST', body }); }
    put<T>(endpoint: string, body?: unknown) { return this.request<T>(endpoint, { method: 'PUT', body }); }
    patch<T>(endpoint: string, body?: unknown) { return this.request<T>(endpoint, { method: 'PATCH', body }); }
    delete<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'DELETE' }); }

    async download(endpoint: string, filename: string) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            credentials: 'include',
        });
        if (response.status === 401 && onUnauthorized) onUnauthorized();
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Download failed' }));
            throw { status: response.status, ...error };
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { resetCsrf };
