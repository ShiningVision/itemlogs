// components/reference-data/ManageFiltersModal.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/widgets/Button';
import { XMarkIcon, PlusIcon, TrashIcon, Bars3BottomLeftIcon, ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Tag } from './TagManagerModal';

export type ManagedResourceKey = 'category' | 'type' | 'location';

export type ManagedResourceConfig = {
  key: ManagedResourceKey;
  apiPath: string;
  label: string;
  items: Tag[];
  itemCounts: Record<number, number>;
};

// Tabbed sibling to TagManagerModal's "manage" mode — lets someone clean up
// categories, types, and locations in one sitting instead of opening,
// editing, and closing three separate single-resource modals in a row (see
// ItemFiltersBar, which used to render one TagManagerModal per section's
// cog button). TagManagerModal itself is untouched: its "assign" mode
// (picking a value for one field on one item, opened from ItemForm) is a
// genuinely single-resource job with no bulk-cleanup use case, so it
// doesn't benefit from tabs the way this manage-only flow does.
export function ManageFiltersModal({
  resources,
  initialResource,
  onClose,
}: {
  resources: ManagedResourceConfig[];
  initialResource: ManagedResourceKey;
  onClose: () => void;
}) {
  const t = useTranslations('referenceData');
  const router = useRouter();

  const [activeKey, setActiveKey] = useState<ManagedResourceKey>(initialResource);
  const [sortMode, setSortMode] = useState<'alpha' | 'usage'>('alpha');
  // Same reasoning as FilterTagPickerModal's search box — a tenant with a
  // long tag list shouldn't have to scroll through all of it to find the
  // one they want to rename or delete.
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // One local pool per resource, keyed by resource key — kept in sync with
  // props but also updated optimistically on create/rename/delete, same
  // reasoning as TagManagerModal's own `pool`. Keyed so switching tabs
  // doesn't lose an edit made on a tab you've since navigated away from
  // (a plain router.refresh() wouldn't reach this component until the next
  // render, and even then only for the currently-open tab's own props).
  const [pools, setPools] = useState<Record<ManagedResourceKey, Tag[]>>(() =>
    Object.fromEntries(resources.map((r) => [r.key, r.items])) as Record<ManagedResourceKey, Tag[]>
  );

  const active = resources.find((r) => r.key === activeKey) ?? resources[0];
  const pool = pools[active.key];

  const sortedItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query ? pool.filter((item) => (item.name ?? '').toLowerCase().includes(query)) : pool;
    const copy = [...filtered];
    if (sortMode === 'usage') {
      // Usage first, alphabetical as the tiebreak — same as TagManagerModal.
      copy.sort((a, b) => {
        const usageDiff = (active.itemCounts[b.id] ?? 0) - (active.itemCounts[a.id] ?? 0);
        return usageDiff !== 0 ? usageDiff : (a.name ?? '').localeCompare(b.name ?? '');
      });
    } else {
      copy.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }
    return copy;
  }, [pool, active.itemCounts, sortMode, search]);

  function switchTab(key: ManagedResourceKey) {
    setActiveKey(key);
    // In-progress state belongs to whichever tab it was started on — a new
    // tab shouldn't inherit a half-typed name, an open rename row, or a
    // search term from the one you just left.
    setNewName('');
    setEditingId(null);
    setDeleteTarget(null);
    setSearch('');
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(active.apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      const { data } = await res.json();
      setNewName('');
      setPools((prev) => ({ ...prev, [active.key]: [...prev[active.key], { id: data.id, name: data.name }] }));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(item: Tag) {
    setEditingId(item.id);
    setEditingName(item.name ?? '');
  }

  async function handleSaveEdit(id: number) {
    const name = editingName.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${active.apiPath}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setEditingId(null);
        setPools((prev) => ({
          ...prev,
          [active.key]: prev[active.key].map((tag) => (tag.id === id ? { ...tag, name } : tag)),
        }));
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runDelete(id: number) {
    setIsDeleting(true);
    try {
      await fetch(`${active.apiPath}/${id}`, { method: 'DELETE' });
      setPools((prev) => ({ ...prev, [active.key]: prev[active.key].filter((tag) => tag.id !== id) }));
      router.refresh();
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  // Zero usage skips the confirm dialog entirely — same as TagManagerModal.
  function handleDeleteClick(item: Tag) {
    if ((active.itemCounts[item.id] ?? 0) === 0) {
      runDelete(item.id);
    } else {
      setDeleteTarget(item);
    }
  }

  const affectedCount = deleteTarget ? (active.itemCounts[deleteTarget.id] ?? 0) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-background)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          maxWidth: '440px',
          width: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-lg)' }}>
            {t('manageFiltersTitle')}
          </h2>
          <Tooltip text={t('close')}>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <XMarkIcon style={{ width: '20px', height: '20px' }} />
            </button>
          </Tooltip>
        </div>

        <div style={{ display: 'flex', marginBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
          {resources.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => switchTab(r.key)}
              aria-current={r.key === active.key}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                borderBottom: r.key === active.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                padding: 'var(--spacing-sm)',
                color: r.key === active.key ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontWeight: r.key === active.key ? 'var(--font-weight-bold)' : 'normal',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
              }}
            >
              {r.label} · {pools[r.key].length}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder={t('newLabelName', { label: active.label })}
            style={{ flex: 1, padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
          />
          <Button onClick={handleCreate} disabled={isSubmitting || !newName.trim()}>
            <PlusIcon style={{ width: '16px', height: '16px' }} />
            {t('create')}
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MagnifyingGlassIcon
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 'var(--spacing-sm)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                paddingLeft: '36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexShrink: 0 }}>
            <Tooltip text={t('sortAlpha')}>
              <button
                type="button"
                onClick={() => setSortMode('alpha')}
                aria-label={t('sortAlpha')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: sortMode === 'alpha' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  display: 'flex',
                }}
              >
                <Bars3BottomLeftIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </Tooltip>
            <Tooltip text={t('sortUsage')}>
              <button
                type="button"
                onClick={() => setSortMode('usage')}
                aria-label={t('sortUsage')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: sortMode === 'usage' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  display: 'flex',
                }}
              >
                <ChartBarIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </Tooltip>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', overflowY: 'auto' }}>
          {sortedItems.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>{t('noSearchResults')}</p>
          )}
          {sortedItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {editingId === item.id ? (
                <>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                    style={{ flex: 1, padding: 'var(--spacing-xs)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                    autoFocus
                  />
                  <button type="button" onClick={() => handleSaveEdit(item.id)} disabled={isSubmitting}>{t('save')}</button>
                  <button type="button" onClick={() => setEditingId(null)}>{t('cancel')}</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, cursor: 'pointer' }} onClick={() => startEdit(item)}>
                    {item.name}
                  </span>
                  {(active.itemCounts[item.id] ?? 0) > 0 && (
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      {active.itemCounts[item.id]}
                    </span>
                  )}
                  <Tooltip text={t('delete')}>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(item)}
                      aria-label={t('delete')}
                      style={{
                        flexShrink: 0,
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-danger)',
                        color: '#fff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <TrashIcon style={{ width: '16px', height: '16px' }} />
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message={
            affectedCount > 0
              ? t('confirmDeleteLabelWithItems', { label: active.label, count: affectedCount })
              : t('confirmDeleteLabelNoItems', { label: active.label })
          }
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          onConfirm={() => deleteTarget && runDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isConfirming={isDeleting}
        />
      )}
    </div>
  );
}
