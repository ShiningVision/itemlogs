// components/sales/SalesTimeline.tsx
import { Fragment } from 'react';
import { getFormatter } from 'next-intl/server';
import { SaleCard } from './SaleCard';
import type { Sale } from '@/app/lib/definitions';

export async function SalesTimeline({
  sales,
  itemCounts,
}: {
  sales: Sale[];
  itemCounts: Record<number, number>;
}) {
  const format = await getFormatter();

  // `sales` is already ordered newest-date-first (see getSales()). Group
  // consecutive entries that share a date into one timeline "day" section.
  const groups: { date: string; sales: Sale[] }[] = [];
  for (const sale of sales) {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup && currentGroup.date === sale.date) {
      currentGroup.sales.push(sale);
    } else {
      groups.push({ date: sale.date, sales: [sale] });
    }
  }

  return (
    <div className="timeline">
      {groups.map((group) => (
        <Fragment key={group.date}>
          <div className="timeline-row">
            <div className="timeline-rail">
              <div className="timeline-dot timeline-dot-date" />
              <div className="timeline-connector" />
            </div>
            <div className="timeline-content">
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
                {format.dateTime(new Date(`${group.date}T00:00:00`), {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h2>
            </div>
          </div>

          {group.sales.map((sale) => (
            <div className="timeline-row" key={sale.id}>
              <div className="timeline-rail">
                <div className="timeline-dot" />
                <div className="timeline-connector" />
              </div>
              <div className="timeline-content">
                <SaleCard sale={sale} itemCount={itemCounts[sale.id] ?? 0} />
              </div>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
