// components/dashboard/RecentActivity.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getRecentItems } from '@/app/lib/services/items';

// "Recently added," not "recent activity" in the broader sense — items have
// no created_at/updated_at column (see getRecentItems's comment), so a
// sold-items timeline isn't something this can honestly show. Framed
// narrowly on purpose rather than implying more than the data supports.
export async function RecentActivity() {
  const t = await getTranslations('dashboard');
  const tItems = await getTranslations('items');
  const items = await getRecentItems(5);

  return (
    <div className="dashboard-card dashboard-recent-activity">
      <h2 className="dashboard-card-title">{t('recentActivityTitle')}</h2>
      {items.length === 0 ? (
        <p className="dashboard-chart-empty">{t('recentActivityEmpty')}</p>
      ) : (
        <ul className="dashboard-recent-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/dashboard/items/${item.id}/edit`} className="dashboard-recent-link">
                <span className="dashboard-recent-name">{item.name || t('recentActivityUnnamed')}</span>
                <span className={`dashboard-recent-status dashboard-recent-status--${item.status}`}>
                  {tItems(`status${item.status}` as 'status1' | 'status2' | 'status3' | 'status4')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
