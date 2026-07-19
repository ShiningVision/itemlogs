// components/reference-data/ReferenceDataManager.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/widgets/Button';

type Item = { id: number; name: string | null };

export function ReferenceDataManager({
  items,
  itemCounts,
  apiPath,
  label,
  pagination,
}: {
  items: Item[];
  itemCounts: Record<number, number>;
  apiPath: string;
  label: string;
  pagination?: React.ReactNode;
}) {
  const t = useTranslations('referenceData');
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        setError('Failed to add.');
        return;
      }
      setNewName('');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditingName(item.name ?? '');
  }

  async function handleSaveEdit(id: number) {
    if (!editingName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiPath}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (res.ok) {
        setEditingId(null);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`${apiPath}/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  const affectedCount = deleteTarget ? (itemCounts[deleteTarget.id] ?? 0) : 0;

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '480px' }}>
      <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-lg)' }}>
        {t('manageLabel', { label })}
      </h1>

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('newLabelName', { label })}
          style={{ flex: 1, padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
        />
        <Button onClick={handleAdd} disabled={isSubmitting || !newName.trim()}>{t('add')}</Button>
      </div>

      {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--spacing-md)' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        {items.map((item) => (
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
                  style={{ flex: 1, padding: 'var(--spacing-xs)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
                <button type="button" onClick={() => handleSaveEdit(item.id)} disabled={isSubmitting}>{t('save')}</button>
                <button type="button" onClick={() => setEditingId(null)}>{t('cancel')}</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, cursor: 'pointer' }} onClick={() => startEdit(item)}>{item.name}</span>
                {itemCounts[item.id] > 0 && (
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    {itemCounts[item.id]}
                  </span>
                )}
                <button type="button" onClick={() => setDeleteTarget(item)}>{t('delete')}</button>
              </>
            )}
          </div>
        ))}
      </div>

      {pagination}

      <Link href="/dashboard/items" style={{ display: 'inline-block', marginTop: 'var(--spacing-lg)' }}>
        <Button type="button">{t('backToItems')}</Button>
      </Link>

      {deleteTarget && (
        <ConfirmDialog
          message={
            affectedCount > 0
              ? t('confirmDeleteLabelWithItems', { label, count: affectedCount })
              : t('confirmDeleteLabelNoItems', { label })
          }
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