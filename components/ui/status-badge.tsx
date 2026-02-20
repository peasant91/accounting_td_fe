import { cn } from "@/lib/utils"
import { InvoiceStatus } from "@/types/invoice"
import { CustomerStatus } from "@/types/customer"

interface StatusBadgeProps {
    status: InvoiceStatus | CustomerStatus | string
    className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
    // Invoice Statuses
    draft: {
        label: "Draft",
        className: "bg-zinc-100 text-zinc-600",
    },
    sent: {
        label: "Sent",
        className: "bg-blue-100 text-blue-600",
    },
    paid: {
        label: "Paid",
        className: "bg-emerald-100 text-emerald-600",
    },
    overdue: {
        label: "Overdue",
        className: "bg-red-100 text-red-600",
    },
    cancelled: {
        label: "Cancelled",
        className: "bg-gray-100 text-gray-600",
    },

    // Customer Statuses
    active: {
        label: "Active",
        className: "bg-emerald-100 text-emerald-600",
    },
    inactive: {
        label: "Inactive",
        className: "bg-zinc-100 text-zinc-600",
    },

    // Recurring Invoice Statuses
    pending: {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800",
    },
    completed: {
        label: "Completed",
        className: "bg-green-100 text-green-800",
    },
    terminated: {
        label: "Terminated",
        className: "bg-red-100 text-red-800",
    },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    )
}
