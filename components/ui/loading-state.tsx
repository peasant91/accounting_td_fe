import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingStateProps {
    message?: string;
    className?: string;
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground",
                className
            )}
        >
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{message}</span>
        </div>
    )
}
