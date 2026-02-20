import { cn } from '@/lib/utils';
import { InvoiceType } from '@/types';
import { RefreshCw, FileText } from 'lucide-react';

interface TypeBadgeProps {
    type: InvoiceType;
    className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
    const isRecurring = type === 'recurring';

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border",
                isRecurring
                    ? "bg-purple-100 text-purple-700 border-purple-200"
                    : "bg-gray-100 text-gray-700 border-gray-200",
                className
            )}
        >
            {isRecurring ? <RefreshCw className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            <span>{type}</span>
        </div>
    );
}
