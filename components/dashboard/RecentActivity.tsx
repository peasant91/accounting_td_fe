import styles from './Dashboard.module.css';
import { formatRelativeTime } from '@/lib/utils';
import { DashboardSummary } from '@/types';

interface RecentActivityProps {
    activities: DashboardSummary['recent_activity'];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    return (
        <section className={styles.activitySection}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <div className={styles.activityList}>
                {activities && activities.length > 0 ? (
                    activities.map((activity) => (
                        <div key={activity.id} className={styles.activityItem}>
                            <div className={styles.activityDot} />
                            <div className={styles.activityContent}>
                                <p className={styles.activityDescription}>
                                    {activity.description}
                                </p>
                                <span className={styles.activityTime}>
                                    {formatRelativeTime(activity.created_at)}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.noActivity}>
                        <p>No recent activity</p>
                    </div>
                )}
            </div>
        </section>
    );
}
