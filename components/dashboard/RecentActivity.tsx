import { formatRelativeTime } from '@/lib/utils';
import { DashboardSummary } from '@/types';

interface RecentActivityProps {
    activities: DashboardSummary['recent_activity'];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
            <div className="bg-card rounded-lg border border-border divide-y divide-border">
                {activities && activities.length > 0 ? (
                    activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-4">
                            <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground">
                                    {activity.description}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                    {formatRelativeTime(activity.created_at)}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        <p>No recent activity</p>
                    </div>
                )}
            </div>
        </section>
    );
}
