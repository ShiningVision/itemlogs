// components/reference-data/TagManagerModal.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/widgets/Button';
import {
  XMarkIcon,
  PlusIcon,
  CheckIcon,
  TrashIcon,
  Bars3BottomLeftIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export type Tag = { id: number; name: string | null };

// Shared portal-based modal for category/type/location tag management —
// used both as the "manage" entry point (CRUD only, reached from
// ItemFiltersBar, no item context) and as the "assign" flow (reached from
// an item's location/category/type field). Same component, two modes:
// which UI shows up (Create vs Assign/Confirm) depends entirely on `mode`,
// not on whether an item id exists yet — a brand-new, not-yet-saved item
// just operates on local component state until it's actually submitted,
// same as an existing item's PATCH.
export function TagManagerModal({
  mode,
  multi = false,
  apiPath,
  label,
  items,
  itemCounts,
  selectedIds = [],
  onAssign,
  onClose,
  defaultSortMode = 'alpha',
}: {
  mode: 'manage' | 'assign';
  multi?: boolean;
  apiPath: string;
  label: string;
  items: Tag[];
  itemCounts: Record<number, number>;
  selectedIds?: number[];
  onAssign?: (tags: Tag[]) => void;
  onClose: () => void;
  // The filter bar's "more" overflow modal (see ItemFiltersBar) wants
  // usage-first-then-alphabetical by default, since that mirrors the
  // pill row's own default ordering (most-used tags visible before the
  // row overflows). The original "Manage" entry points keep defaulting to
  // alpha, unaffected — only the initial state differs, the toggle itself
  // still works the same either way.
  defaultSortMode?: 'alpha' | 'usage';
}) {
  const t = useTranslations('referenceData');
  const router = useRouter();

  const [sortMode, setSortMode] = useState<'alpha' | 'usage'>(defaultSortMode);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selection, setSelection] = useState<number[]>(selectedIds);
  // Local copy of `items`, kept in sync with props but also updated
  // optimistically the instant something is created/renamed/deleted —
  // rather than waiting on router.refresh() to re-fetch and flow a new
  // `items` prop back down through the parent. That refresh still happens
  // (other consumers, like item counts elsewhere on the page, depend on
  // it), but the modal's own list and any id->name lookups it needs for
  // onAssign shouldn't have to wait on it.
  const [pool, setPool] = useState<Tag[]>(items);

  const sortedItems = useMemo(() => {
    const copy = [...pool];
    if (sortMode === 'usage') {
      // Usage first, alphabetical as the tiebreak — otherwise same-count
      // tags fall back to whatever order `pool` happens to be in.
      copy.sort((a, b) => {
        const usageDiff = (itemCounts[b.id] ?? 0) - (itemCounts[a.id] ?? 0);
        return usageDiff !== 0 ? usageDiff : (a.name ?? '').localeCompare(b.name ?? '');
      });
    } else {
      copy.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }
    return copy;
  }, [pool, itemCounts, sortMode]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      const { data } = await res.json();
      setNewName('');
      setPool((prev) => [...prev, { id: data.id, name: data.name }]);
      router.refresh();

      // Assign mode: creating (rather than just picking an existing tag)
      // is itself the assign action — no separate click needed. Single
      // select assigns + closes immediately; multi select just adds the
      // new tag to the in-progress selection so more can still be picked
      // before Confirm.
      if (mode === 'assign' && data?.id !== undefined) {
        if (multi) {
          setSelection((prev) => [...prev, data.id]);
        } else {
          onAssign?.([{ id: data.id, name: data.name }]);
          onClose();
        }
      }
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
      const res = await fetch(`${apiPath}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setEditingId(null);
        setPool((prev) => prev.map((tag) => (tag.id === id ? { ...tag, name } : tag)));
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runDelete(id: number) {
    setIsDeleting(true);
    try {
      await fetch(`${apiPath}/${id}`, { method: 'DELETE' });
      setSelection((prev) => prev.filter((sid) => sid !== id));
      setPool((prev) => prev.filter((tag) => tag.id !== id));
      router.refresh();
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  // Zero usage skips the confirm dialog entirely — no friction for
  // deleting a tag nothing depends on. Any real usage still goes through
  // ConfirmDialog, with the affected-item count in the message.
  function handleDeleteClick(item: Tag) {
    if ((itemCounts[item.id] ?? 0) === 0) {
      runDelete(item.id);
    } else {
      setDeleteTarget(item);
    }
  }

  function handlePick(item: Tag) {
    if (mode !== 'assign') return;
    if (multi) {
      setSelection((prev) =>
        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
      );
    } else {
      onAssign?.([item]);
      onClose();
    }
  }

  function handleConfirmSelection() {
    const tags = selection
      .map((id) => pool.find((tag) => tag.id === id))
      .filter((tag): tag is Tag => tag !== undefined);
    onAssign?.(tags);
    onClose();
  }

  const affectedCount = deleteTarget ? (itemCounts[deleteTarget.id] ?? 0) : 0;

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
            {t('manageLabel', { label })}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            {/* Single-select assign only — the only way to null out an
                already-assigned tag, mirroring the "Other" option on
                category/type's plain <select>. Not shown in multi mode:
                clearing there just means unchecking every box, no dedicated
                action needed. */}
            {mode === 'assign' && !multi && selection.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onAssign?.([]);
                  onClose();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                  textDecoration: 'underline',
                }}
              >
                {t('clear')}
              </button>
            )}
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
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder={t('newLabelName', { label })}
            style={{ flex: 1, padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
          />
          <Button onClick={handleCreate} disabled={isSubmitting || !newName.trim()}>
            <PlusIcon style={{ width: '16px', height: '16px' }} />
            {mode === 'assign' ? t('assign') : t('create')}
          </Button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', overflowY: 'auto' }}>
          {sortedItems.map((item) => {
            const isSelected = selection.includes(item.id);
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm)',
                  background: isSelected ? 'var(--color-primary-subtle, var(--color-surface))' : 'var(--color-surface)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
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
                    {multi && mode === 'assign' && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePick(item)}
                        style={{ flexShrink: 0 }}
                      />
                    )}
                    <span
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => (mode === 'assign' ? handlePick(item) : startEdit(item))}
                    >
                      {item.name}
                    </span>
                    {(itemCounts[item.id] ?? 0) > 0 && (
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                        {itemCounts[item.id]}
                      </span>
                    )}
                    {mode === 'assign' && !multi && isSelected && (
                      <CheckIcon style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
                    )}
                    {mode === 'manage' && (
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
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {mode === 'assign' && multi && (
          <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleConfirmSelection}>
              <CheckIcon style={{ width: '16px', height: '16px' }} />
              {t('confirm')}
            </Button>
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message={
            affectedCount > 0
              ? t('confirmDeleteLabelWithItems', { label, count: affectedCount })
              : t('confirmDeleteLabelNoItems', { label })
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
