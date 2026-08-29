// components/dashboard/AddFeaturedItemsModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';
import { Button } from '@/widgets/Button';

export type FeaturedItem = {
  id: number;
  name: string | null;
  main_image_ref: { url: string } | null;
};

// The Featured Items section's "Add items" entry point (see
// FeaturedItemsSection) — modeled closely on AddItemsToPackageModal, just
// pulling from the not-yet-featured pool (/api/v1/items/unfeatured) instead
// of unassigned-to-a-package items, and capped at however many featured
// slots are actually left rather than being open-ended.
export function AddFeaturedItemsModal({
  cap,
  currentCount,
  onClose,
  onAdded,
}: {
  cap: number;
  currentCount: number;
  onClose: () => void;
  onAdded: (items: FeaturedItem[]) => void;
}) {
  const remainingSlots = Math.max(0, cap - currentCount);
  const t = useTranslations('dashboard');
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/items/unfeatured')
      .then((res) => res.json())
      .then((res) => setItems(res.data ?? []));
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => (item.name ?? '').toLowerCase().includes(query));
  }, [items, search]);

  function toggle(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // Selecting past the number of slots actually left would just bounce
      // off the server's own cap check anyway — stopping it here gives
      // immediate feedback instead of a failed request per extra click.
      if (prev.length >= remainingSlots) return prev;
      return [...prev, id];
    });
  }

  async function handleAdd() {
    setIsSubmitting(true);
    setErrorMessage(null);
    const added: FeaturedItem[] = [];
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/v1/items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_featured: true }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setErrorMessage(json?.error === 'featuredCapReached' ? t('featuredCapReached', { cap }) : t('saveFailed'));
          break;
        }
        const item = items.find((i) => i.id === id);
        if (item) added.push(item);
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
        style={{ background: 'var(--color-background)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', maxWidth: '720px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <h2 style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('addFeaturedItemsTitle')}</h2>
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
            <p style={{ color: 'var(--color-text-muted)' }}>{t('noAvailableFeaturedItems')}</p>
          ) : filteredItems.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>{t('noSearchResults')}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--spacing-sm)' }}>
              {filteredItems.map((item) => {
                const selected = selectedIds.includes(item.id);
                const disabled = !selected && selectedIds.length >= remainingSlots;
                return (
                  <div
                    key={item.id}
                    onClick={() => !disabled && toggle(item.id)}
                    role="checkbox"
                    aria-checked={selected}
                    aria-disabled={disabled}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                        e.preventDefault();
                        toggle(item.id);
                      }
                    }}
                    style={{
                      position: 'relative',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
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
