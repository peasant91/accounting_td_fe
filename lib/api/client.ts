// API client with authentication handling

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setToken(token: string | null) {
        this.token = token;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const isFormData = body instanceof FormData;

        const requestHeaders: Record<string, string> = {
            'Accept': 'application/json',
            ...headers,
        };

        if (!isFormData) {
            requestHeaders['Content-Type'] = 'application/json';
        }

        if (this.token) {
            requestHeaders['Authorization'] = `Bearer ${this.token}`;
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

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw error;
        }

        // Handle empty responses (e.g., DELETE)
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    get<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    post<T>(endpoint: string, body?: unknown) {
        return this.request<T>(endpoint, { method: 'POST', body });
    }

    put<T>(endpoint: string, body?: unknown) {
        return this.request<T>(endpoint, { method: 'PUT', body });
    }

    delete<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // Download file (for PDF)
    async download(endpoint: string, filename: string) {
        const headers: Record<string, string> = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers,
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Download failed' }));
            throw error;
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
