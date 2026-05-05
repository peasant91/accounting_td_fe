import { apiClient } from './client';

export interface CurrencyRate {
    currency: string;
    rate_to_base: number;
    updated_at: string | null;
}

interface ListResponse {
    data: CurrencyRate[];
    base_currency: string;
}

interface ItemResponse {
    data: CurrencyRate;
}

export async function list(): Promise<ListResponse> {
    return apiClient.get<ListResponse>('/currency-rates');
}

export async function upsert(currency: string, rate_to_base: number): Promise<ItemResponse> {
    return apiClient.put<ItemResponse>(`/currency-rates/${currency}`, { rate_to_base });
}
