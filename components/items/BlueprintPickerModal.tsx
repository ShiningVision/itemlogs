// components/items/BlueprintPickerModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RemoveXButton } from '@/components/ui/RemoveXButton';

type BlueprintRow = {
  id: number;
  name: string | null;
  barcode: string | null;
  description: string | null;
  origin: string | null;
  status: number;
  cost_price: number | null;
  purchase_price: number | null;
  purchase_price_currency: number;
  sell_price: number | null;
  type: number | null;
  category: number | null;
  main_image: number | null;
  main_image_ref: { url: string } | null;
};

export function BlueprintPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (blueprint: BlueprintRow) => void;
  onClose: () => void;
}) {
  const t = useTranslations('items');
  const [blueprints, setBlueprints] = useState<BlueprintRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<BlueprintRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/v1/blueprints')
      .then((res) => res.json())
      .then((res) => setBlueprints(res.data ?? []));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/v1/blueprints/${deleteTarget.id}`, { method: 'DELETE' });
      setBlueprints((prev) => prev.filter((bp) => bp.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--color-background)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-md)' }}>{t('selectBlueprint')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          {blueprints.map((bp) => (
            <div key={bp.id} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => { onSelect(bp); onClose(); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: 'var(--spacing-sm)',
                  paddingRight: '44px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                }}
              >
                <div>{bp.name}</div>
                {bp.barcode !== null && (
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    {bp.barcode}
                  </div>
                )}
              </button>

              <RemoveXButton
                onClick={() => setDeleteTarget(bp)}
                label={t('delete')}
              />
            </div>
          ))}
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message={t('confirmDeleteBlueprint')}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isConfirming={isDeleting}
        />
      )}
    </div>
  );
}
