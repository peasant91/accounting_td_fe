'use client';

import { useCallback, useMemo, useState } from 'react';
import { InvoiceItemFormData } from '@/types';

const emptyItem: InvoiceItemFormData = {
    description: '',
    notes: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
};

export interface UseLineItemsOptions {
    initial?: InvoiceItemFormData[];
    taxRate?: number;
}

const STRING_FIELDS = new Set<keyof InvoiceItemFormData>(['description', 'notes']);

export function useLineItems({ initial, taxRate = 0 }: UseLineItemsOptions = {}) {
    const [items, setItems] = useState<InvoiceItemFormData[]>(
        initial && initial.length > 0 ? initial : [{ ...emptyItem }]
    );

    const replaceAll = useCallback((next: InvoiceItemFormData[]) => {
        setItems(next.length > 0 ? next : [{ ...emptyItem }]);
    }, []);

    const updateItem = useCallback(
        (index: number, field: keyof InvoiceItemFormData, value: string | number) => {
            setItems((prev) => {
                const next = [...prev];
                const updated: InvoiceItemFormData = {
                    ...next[index],
                    [field]: STRING_FIELDS.has(field) ? value : Number(value),
                };
                updated.amount = updated.quantity * updated.unit_price;
                next[index] = updated;
                return next;
            });
        },
        []
    );

    const addItem = useCallback(() => {
        setItems((prev) => [...prev, { ...emptyItem }]);
    }, []);

    const removeItem = useCallback((index: number) => {
        setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
    }, []);

    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
        [items]
    );
    const tax = useMemo(() => (subtotal * taxRate) / 100, [subtotal, taxRate]);
    const total = useMemo(() => subtotal + tax, [subtotal, tax]);

    return { items, setItems: replaceAll, updateItem, addItem, removeItem, subtotal, tax, total };
}
