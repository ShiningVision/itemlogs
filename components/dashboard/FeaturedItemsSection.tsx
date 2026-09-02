// components/dashboard/FeaturedItemsSection.tsx
'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Toggle } from '@/components/ui/Toggle';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/widgets/Button';
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';
import { updateStorefrontSettingFieldAction } from '@/app/lib/actions/settings';
import { AddFeaturedItemsModal, type FeaturedItem } from './AddFeaturedItemsModal';

// Featured items used to be picked one at a time from an item's own edit
// page (a toggle buried in ItemForm, with no view of which/how many items
// were already featured) — unintuitive for something that's really a
// visitor-page-wide setting. This section replaces that: a single place to
// see every currently-featured item, add or remove them, and turn the
// spotlight strip on/off, all from the Visitor Page Settings card.
//
export function FeaturedItemsSection({
  initialItems,
  cap,
  defaultShowFeatured,
}: {
  initialItems: FeaturedItem[];
  cap: number;
  defaultShowFeatured: boolean;
}) {
  const t = useTranslations('dashboard');
  const [items, setItems] = useState<FeaturedItem[]>(initialItems);
  const [showFeatured, setShowFeatured] = useState(defaultShowFeatured);
  const [toggleStatus, setToggleStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
  const [, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  function handleToggleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setShowFeatured(checked);
    setToggleStatus('saving');
    startTransition(async () => {
      const result = await updateStorefrontSettingFieldAction('show_featured_items', checked);
      setToggleStatus(result && 'error' in result ? 'error' : 'saved');
      setTimeout(() => setToggleStatus(null), 1500);
    });
  }

  async function handleRemove(id: number) {
    setRemovingId(id);
    setRemoveError(null);
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/v1/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: false }),
      });
      if (!res.ok) {
        setItems(previous);
        setRemoveError(t('saveFailed'));
      }
    } catch {
      setItems(previous);
      setRemoveError(t('saveFailed'));
    } finally {
      setRemovingId(null);
    }
  }

  function handleAdded(added: FeaturedItem[]) {
    setItems((prev) => [...prev, ...added].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')));
  }

  const atCap = items.length >= cap;

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t('sectionFeaturedItems')}</div>
      <div className="settings-group">
        <div className="settings-row">
          <Tooltip text={t('showFeaturedItemsHint')}>
            <span>{t('showFeaturedItems')}</span>
          </Tooltip>
          <div className="settings-row-controls">
            {toggleStatus && (
              <span className="settings-row-status" style={toggleStatus === 'error' ? { color: 'var(--color-danger)' } : undefined}>
                {toggleStatus === 'saving' ? t('saving') : toggleStatus === 'error' ? t('saveFailed') : t('saved')}
              </span>
            )}
            <Toggle
              name="show_featured_items"
              defaultChecked={showFeatured}
              label={t('showFeaturedItems')}
              onChange={handleToggleChange}
            />
          </div>
        </div>

        <div style={{ padding: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              {t('featuredItemsCount', { count: items.length, cap })}
            </span>
            <Tooltip text={atCap ? t('featuredCapReached', { cap }) : ''}>
              <Button type="button" onClick={() => setAddModalOpen(true)} disabled={atCap}>
                {t('addFeaturedItemsButton')}
              </Button>
            </Tooltip>
          </div>

          {removeError && (
            <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
              {removeError}
            </div>
          )}

          {items.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>{t('noFeaturedItems')}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--spacing-sm)' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    opacity: removingId === item.id ? 0.5 : 1,
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

                  <Tooltip text={t('removeFeatured')}>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      aria-label={t('removeFeatured')}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        color: 'var(--color-danger)',
                      }}
                    >
                      <XMarkIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {addModalOpen && (
        <AddFeaturedItemsModal
          cap={cap}
          currentCount={items.length}
          onClose={() => setAddModalOpen(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
