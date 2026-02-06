import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Re-export all utilities from the utils folder
export * from './utils/formatters';
export * from './utils/validators';
