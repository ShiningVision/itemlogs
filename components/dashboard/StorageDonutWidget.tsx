// components/dashboard/StorageDonutWidget.tsx
import { getTranslations } from 'next-intl/server';
import { getBlobUsage, BLOB_LIMIT_BYTES } from '@/app/lib/storage/blob-usage';
import { formatBytes } from '@/app/lib/storage/format-bytes';
import { StorageWidgetToggle } from './StorageWidgetToggle';

// Donut drawn via a single stroked <circle> per segment, offsetting each by
// the running total so far — a standard trick that avoids hand-computing
// SVG arc paths (M/A commands) for what's just a handful of segments.
const SIZE = 120;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function Segment({ pct, offset, className }: { pct: number; offset: number; className: string }) {
  if (pct <= 0) return null;
  const length = (pct / 100) * CIRCUMFERENCE;
  return (
    <circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={RADIUS}
      fill="none"
      strokeWidth={STROKE}
      strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
      strokeDashoffset={-offset}
      className={className}
      transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
    />
  );
}

// Only ever calls getBlobUsage() (the expensive, paginated list()-walking
// scan — see blob-usage.ts) when `enabled` is true, i.e. the tenant has
// opted in via show_dashboard_storage_widget. That's the whole point of the
// toggle: this widget costs nothing on a dashboard load where it's off.
export async function StorageDonutWidget({ enabled }: { enabled: boolean }) {
  const t = await getTranslations('dashboard');

  if (!enabled) {
    return (
      <div className="dashboard-card dashboard-storage-card">
        <div className="dashboard-card-header-row">
          <h2 className="dashboard-card-title">{t('chartStorageTitle')}</h2>
          <StorageWidgetToggle defaultChecked={false} />
        </div>
        <p className="dashboard-chart-empty">{t('chartStorageDisabledHint')}</p>
      </div>
    );
  }

  const usage = await getBlobUsage();
  const freeBytes = Math.max(0, BLOB_LIMIT_BYTES - usage.totalBytes);
  const denom = Math.max(usage.totalBytes + freeBytes, 1);

  const imagesPct = (usage.imagesBytes / denom) * 100;
  const documentsPct = (usage.documentsBytes / denom) * 100;
  const otherPct = (usage.otherBytes / denom) * 100;
  const freePct = Math.max(0, 100 - imagesPct - documentsPct - otherPct);

  return (
    <div className="dashboard-card dashboard-storage-card">
      <div className="dashboard-card-header-row">
        <h2 className="dashboard-card-title">{t('chartStorageTitle')}</h2>
        <StorageWidgetToggle defaultChecked={true} />
      </div>

      <div className="dashboard-donut-row">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={t('chartStorageUsed', { used: formatBytes(usage.totalBytes), limit: formatBytes(BLOB_LIMIT_BYTES) })}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="dashboard-donut-track" />
          <Segment pct={imagesPct} offset={0} className="dashboard-donut-segment dashboard-donut-segment--images" />
          <Segment pct={documentsPct} offset={(imagesPct / 100) * CIRCUMFERENCE} className="dashboard-donut-segment dashboard-donut-segment--documents" />
          <Segment pct={otherPct} offset={((imagesPct + documentsPct) / 100) * CIRCUMFERENCE} className="dashboard-donut-segment dashboard-donut-segment--other" />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="dashboard-donut-center-text">
            {Math.round(100 - freePct)}%
          </text>
        </svg>

        <ul className="dashboard-donut-legend">
          <li>
            <span className="dashboard-donut-swatch dashboard-donut-swatch--images" aria-hidden="true" />
            {t('storageImages', { used: formatBytes(usage.imagesBytes) })}
          </li>
          <li>
            <span className="dashboard-donut-swatch dashboard-donut-swatch--documents" aria-hidden="true" />
            {t('storageDocuments', { used: formatBytes(usage.documentsBytes) })}
          </li>
          <li>
            <span className="dashboard-donut-swatch dashboard-donut-swatch--free" aria-hidden="true" />
            {t('chartStorageFree', { free: formatBytes(freeBytes) })}
          </li>
        </ul>
      </div>
    </div>
  );
}
