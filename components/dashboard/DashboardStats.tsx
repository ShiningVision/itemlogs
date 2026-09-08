// components/dashboard/DashboardStats.tsx
import { getTranslations } from 'next-intl/server';
import { getItemsTotalCount } from '@/app/lib/services/items';
import { getPackagesTotalCount } from '@/app/lib/services/packages';
import { getSalesTotalCount } from '@/app/lib/services/sales';

// Deliberately count-only (head: true) queries — no full row fetches, and no
// storage/blob usage here. blob-usage.ts's size calculation walks every blob
// via list() and is only cheap enough for the lower-traffic Gallery page
// where it already lives; it stays out of the dashboard on purpose.
export async function DashboardStats({ showSales }: { showSales: boolean }) {
  const t = await getTranslations('dashboard');

  // Sales don't exist as a concept for a tenant with use_sell_price off
  // (mirrors EarningsExpensesChart/QuickSellButton being gated on the same
  // flag elsewhere on this page) — skip the count query entirely rather
  // than fetching it just to hide the number.
  const [items, packages, sales] = await Promise.all([
    getItemsTotalCount(),
    getPackagesTotalCount(),
    showSales ? getSalesTotalCount() : Promise.resolve(null),
  ]);

  const stats = [
    { key: 'items', value: items, label: t('statsItems') },
    { key: 'packages', value: packages, label: t('statsPackages') },
    ...(showSales ? [{ key: 'sales', value: sales as number, label: t('statsSales') }] : []),
  ];

  return (
    <div className="dashboard-stats-strip">
      {stats.map((stat) => (
        <div key={stat.key} className="dashboard-stat">
          <span className="dashboard-stat-value">{stat.value}</span>
          <span className="dashboard-stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
