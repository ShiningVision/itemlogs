// components/packages/AddItemsToPackageModal.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';
import { Button } from '@/widgets/Button';

type UnassignedItem = {
  id: number;
  name: string | null;
  main_image_ref: { url: string } | null;
  category_ref: { name: string } | null;
};

export function AddItemsToPackageModal({
  packageId,
  onClose,
  onAdded,
}: {
  packageId: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const t = useTranslations('packages');
  const itemsT = useTranslations('items');
  const [items, setItems] = useState<UnassignedItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/v1/items/unassigned')
      .then((res) => res.json())
      .then((res) => setItems(res.data ?? []));
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => (item.name ?? '').toLowerCase().includes(query));
  }, [items, search]);

  function toggle(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleAdd() {
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/v1/items/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ package_id: packageId }),
          })
        )
      );
      onAdded();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 'var(--spacing-md)' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--color-background)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', maxWidth: '720px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <h2 style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('addItemsToPackage')}</h2>
          <input
            type="text"
            className="sheet-input"
            placeholder={t('searchItemsPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '240px' }}
          />
        </div>

        <div style={{ overflowY: 'auto', flex: 1, marginBottom: 'var(--spacing-md)' }}>
          {items.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>{t('noUnassignedItems')}</p>
          ) : filteredItems.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>{t('noSearchResults')}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--spacing-sm)' }}>
              {filteredItems.map((item) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    role="checkbox"
                    aria-checked={selected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle(item.id);
                      }
                    }}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      border: selected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--spacing-xs)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      background: selected ? 'var(--color-surface)' : 'var(--color-background)',
                      transition: 'border-color var(--motion-duration) var(--motion-easing)',
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      {item.main_image_ref?.url ? (
                        <img
                          src={item.main_image_ref.url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <NoImagePlaceholder />
                      )}
                    </div>

                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.category_ref?.name ?? itemsT('other')}
                    </span>

                    {selected && (
                      <CheckCircleIcon
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '22px',
                          height: '22px',
                          color: 'var(--color-primary)',
                          background: 'var(--color-background)',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
