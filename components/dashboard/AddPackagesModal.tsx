// components/dashboard/AddPackagesModal.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Button } from '@/widgets/Button';
import type { VisibilityPackage } from './PackageVisibilitySection';

// The Package Visibility section's "Add" entry point — a plain
// select/deselect grid over the packages not yet shown on the visitor
// page (passed in from PackageVisibilitySection, which already holds the
// full list, so unlike AddFeaturedItemsModal this doesn't need its own
// fetch or a cap check). Modeled closely on AddFeaturedItemsModal minus
// the image thumbnails and the slot limit — packages don't have cover
// images and there's no cap on how many can be shown at once.
export function AddPackagesModal({
  packages,
  packageLabel,
  onClose,
  onAdded,
}: {
  packages: VisibilityPackage[];
  packageLabel: string;
  onClose: () => void;
  onAdded: (addedIds: number[]) => void;
}) {
  const t = useTranslations('dashboard');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function toggle(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleAdd() {
    setIsSubmitting(true);
    setErrorMessage(null);
    const added: number[] = [];
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/v1/packages/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ show_on_storefront: true }),
        });
        if (!res.ok) {
          setErrorMessage(t('saveFailed'));
          break;
        }
        added.push(id);
      }
    } finally {
      if (added.length > 0) onAdded(added);
      setIsSubmitting(false);
      if (added.length === selectedIds.length) onClose();
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 'var(--spacing-md)' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--color-background)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', maxWidth: '560px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-md)' }}>
          {t('addPackagesTitle', { packages: packageLabel })}
        </h2>

        <div style={{ overflowY: 'auto', flex: 1, marginBottom: 'var(--spacing-md)' }}>
          {packages.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>{t('noAvailablePackagesToAdd', { packages: packageLabel })}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              {packages.map((pkg) => {
                const selected = selectedIds.includes(pkg.id);
                return (
                  <div
                    key={pkg.id}
                    onClick={() => toggle(pkg.id)}
                    role="checkbox"
                    aria-checked={selected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle(pkg.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      border: selected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--spacing-sm)',
                      background: selected ? 'var(--color-surface)' : 'var(--color-background)',
                      transition: 'border-color var(--motion-duration) var(--motion-easing)',
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>{pkg.name}</span>
                    {selected && (
                      <CheckCircleIcon
                        style={{ width: '20px', height: '20px', color: 'var(--color-primary)', flexShrink: 0 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {errorMessage && (
          <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
            {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            {t('selectedCount', { count: selectedIds.length })}
          </span>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button type="button" onClick={onClose}>{t('cancel')}</button>
            <Button onClick={handleAdd} disabled={isSubmitting || selectedIds.length === 0}>
              {isSubmitting ? t('adding') : t('add')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
