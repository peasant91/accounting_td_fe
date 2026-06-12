'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PriceInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
    value: string | number | null | undefined;
    onChange: (rawValue: string) => void;
    className?: string;
}

function formatDisplay(raw: string): string {
    if (!raw) return '';
    const [intPart, decPart] = raw.split('.');
    const num = Number(intPart.replace(/\D/g, '') || 0);
    const formatted = new Intl.NumberFormat('id-ID').format(num);
    return decPart !== undefined ? `${formatted},${decPart}` : formatted;
}

function parseRaw(display: string): string {
    return display.replace(/\./g, '').replace(',', '.');
}

export function PriceInput({ value, onChange, className, onBlur, ...props }: PriceInputProps) {
    const rawString = value != null ? String(value) : '';
    const [display, setDisplay] = useState(rawString ? formatDisplay(rawString) : '');

    useEffect(() => {
        const incoming = value != null ? String(value) : '';
        setDisplay(incoming ? formatDisplay(incoming) : '');
    }, [value]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const input = e.target.value;
        const digitsOnly = input.replace(/[^\d,]/g, '');
        const stripped = digitsOnly.replace(/^0+(\d)/, '$1');
        setDisplay(stripped);
        const raw = parseRaw(stripped);
        onChange(raw);
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
        const raw = parseRaw(display);
        if (!raw || raw === '0' || isNaN(Number(raw))) {
            setDisplay('');
            onChange('');
        } else {
            setDisplay(formatDisplay(raw));
        }
        onBlur?.(e);
    }

    return (
        <input
            {...props}
            type="text"
            inputMode="numeric"
            value={display}
            placeholder={props.placeholder ?? '0'}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
        />
    );
}
