import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
    title?: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function ErrorState({
    title = "Something went wrong",
    description = "Please try again later.",
    action,
    className,
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center min-h-[400px] gap-4 text-center",
                className
            )}
        >
            <h3 className="text-lg font-semibold text-destructive">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
            {action && (
                <Button onClick={action.onClick} variant="outline">
                    {action.label}
                </Button>
            )}
        </div>
    )
}
