import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: React.ReactNode;
    variant?: 'default';
    href?: string;
}

export function SummaryCard({ title, value, subValue, icon, href }: SummaryCardProps) {
    const CardContent = (
        <>
            <div className="text-3xl">{icon}</div>
            <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{title}</span>
                <span className="text-2xl font-bold text-foreground">{value}</span>
                {subValue && <span className="text-sm text-muted-foreground">{subValue}</span>}
            </div>
        </>
    );

    const cardClasses = cn(
        "flex items-center gap-4 p-6 bg-card rounded-lg border border-border shadow-sm transition-all",
        href && "hover:shadow-md hover:border-primary/50 cursor-pointer"
    );

    if (href) {
        return (
            <Link href={href} className={cardClasses}>
                {CardContent}
            </Link>
        );
    }

    return (
        <div className={cardClasses}>
            {CardContent}
        </div>
    );
}
