'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';

type SuggestionItem = string | { label: string; value: string; data?: Record<string, unknown> };
type NormalisedItem = { label: string; value: string; data?: Record<string, unknown> };

interface AutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (item: NormalisedItem) => void;
    suggestions: SuggestionItem[];
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    maxSuggestions?: number;
}

function normalise(s: SuggestionItem): NormalisedItem {
    return typeof s === 'string' ? { label: s, value: s } : s;
}

export function Autocomplete({
    value,
    onChange,
    onSelect,
    suggestions,
    placeholder,
    className,
    inputClassName,
    maxSuggestions = 6,
}: AutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const prevValue = useRef(value);
    const justSelected = useRef(false);

    const filtered = value.trim()
        ? suggestions
              .map(normalise)
              .filter((s) => s.label.toLowerCase().includes(value.toLowerCase()))
              .slice(0, maxSuggestions)
        : [];

    // Open only when the user changes the value (not on mount or after a selection)
    if (value !== prevValue.current) {
        prevValue.current = value;
        if (!justSelected.current) {
            setOpen(value.trim().length > 0 && filtered.length > 0);
            setActiveIndex(-1);
        }
        justSelected.current = false;
    }

    const select = (item: NormalisedItem) => {
        justSelected.current = true;
        onChange(item.value);
        onSelect?.(item);
        setOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' && !open && filtered.length > 0) {
            e.preventDefault();
            setOpen(true);
            setActiveIndex(0);
            return;
        }

        if (!open) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, -1));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            select(filtered[activeIndex]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={inputClassName}
                autoComplete="off"
            />
            {open && (
                <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md text-sm">
                    {filtered.map((item, i) => (
                        <li
                            key={i}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                select(item);
                            }}
                            className={cn(
                                'cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground',
                                i === activeIndex && 'bg-accent text-accent-foreground',
                                i < filtered.length - 1 && 'border-b border-border'
                            )}
                        >
                            {item.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
