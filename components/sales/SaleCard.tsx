// components/sales/SaleCard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DeleteXButton } from '@/components/ui/DeleteXButton';
import { Card } from '@/widgets/Card';
import type { Sale } from '@/app/lib/definitions';

export function SaleCard({ sale, itemCount }: { sale: Sale; itemCount: number }) {
  const t = useTranslations('sales');
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await fetch(`/api/v1/sales/${sale.id}`, { method: 'DELETE' });
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <Card href={`/dashboard/sales/${sale.id}/edit`}>
        <div style={{ fontWeight: 'var(--font-weight-bold)' }}>{sale.name ?? sale.date}</div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          {t('itemCount', { count: itemCount })}
        </div>
      </Card>

      <DeleteXButton onClick={() => setConfirmOpen(true)} label={t('delete')} />

      {confirmOpen && (
        <ConfirmDialog
          message={t('confirmDeleteSale')}
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
