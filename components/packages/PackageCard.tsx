// components/packages/PackageCard.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CubeIcon, ClockIcon, TruckIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DeleteXButton } from '@/components/ui/DeleteXButton';
import { Badge } from '@/components/ui/Badge';
import { getPackageStatus, type PackageStatus } from '@/app/lib/packageStatus';
import type { Package } from '@/app/lib/definitions';

const STATUS_ICON: Record<PackageStatus, typeof ClockIcon> = {
  pending: ClockIcon,
  in_transit: TruckIcon,
  arrived: CheckCircleIcon,
};

const STATUS_LABEL_KEY: Record<PackageStatus, string> = {
  pending: 'statusPending',
  in_transit: 'statusInTransit',
  arrived: 'statusArrived',
};

const STATUS_CLASS: Record<PackageStatus, string> = {
  pending: 'package-status-stamp--pending',
  in_transit: 'package-status-stamp--transit',
  arrived: 'package-status-stamp--arrived',
};

export function PackageCard({ pkg, itemCount }: { pkg: Package; itemCount: number }) {
  const t = useTranslations('packages');
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await fetch(`/api/v1/packages/${pkg.id}`, { method: 'DELETE' });
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  const status = getPackageStatus(pkg);
  const StatusIcon = STATUS_ICON[status];

  return (
    <div style={{ position: 'relative' }}>
      <Link
        href={`/dashboard/packages/${pkg.id}/edit`}
        className="catalog-card interactive-card"
        style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <CubeIcon style={{ width: '18px', height: '18px', flexShrink: 0, color: 'var(--color-text-muted)' }} />
          <span className="catalog-card-name">{pkg.name}</span>
        </div>

        <div className={`package-status-stamp ${STATUS_CLASS[status]}`}>
          <StatusIcon style={{ width: '14px', height: '14px' }} />
          {t(STATUS_LABEL_KEY[status])}
        </div>

        {(pkg.departure_date || pkg.arrival_date) && (
          <div className="package-route">
            <span>{pkg.departure_date ?? '—'}</span>
            <span aria-hidden="true">→</span>
            <span>{pkg.arrival_date ?? '—'}</span>
          </div>
        )}

        <div>
          <Badge>{t('itemCount', { count: itemCount })}</Badge>
        </div>
      </Link>

      <DeleteXButton onClick={() => setConfirmOpen(true)} label={t('delete')} />

      {confirmOpen && (
        <ConfirmDialog
          message={t('confirmDeletePackage')}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
          isConfirming={isDeleting}
        />
      )}
    </div>
  );
}
