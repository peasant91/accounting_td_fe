'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';

type SuggestionItem = string | { label: string; value: string };

interface AutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    suggestions: SuggestionItem[];
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    maxSuggestions?: number;
}

function normalise(s: SuggestionItem): { label: string; value: string } {
    return typeof s === 'string' ? { label: s, value: s } : s;
}

export function Autocomplete({
    value,
    onChange,
    suggestions,
    placeholder,
    className,
    inputClassName,
    maxSuggestions = 6,
}: AutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = value.trim()
        ? suggestions
              .map(normalise)
              .filter((s) => s.label.toLowerCase().includes(value.toLowerCase()))
              .slice(0, maxSuggestions)
        : [];

    useEffect(() => {
        setActiveIndex(-1);
        setOpen(filtered.length > 0);
    }, [filtered.length]);

    const select = (item: { label: string; value: string }) => {
        onChange(item.value);
        setOpen(false);
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
                onFocus={() => setOpen(filtered.length > 0)}
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
