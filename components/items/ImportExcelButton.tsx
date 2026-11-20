// components/items/ImportExcelButton.tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/widgets/Button';
import { Toast, type ToastType } from '@/components/ui/notification';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useBeforeUnloadWhile } from '@/app/lib/hooks/useBeforeUnloadWhile';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export function ImportExcelButton() {
  const t = useTranslations('items');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  // A file that deletes items waits here until the person confirms.
  const [pendingDelete, setPendingDelete] = useState<{ file: File; count: number } | null>(null);
  const [notification, setNotification] = useState<{ type: ToastType; message: string } | null>(null);
  // Desktop: native "leave site?" prompt. Phones can't show one, hence the
  // visible banner below as well.
  useBeforeUnloadWhile(isImporting);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    runImport(file, false);
  }

  async function runImport(file: File, confirmDeletes: boolean) {
    setIsImporting(true);
    setNotification(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (confirmDeletes) formData.append('confirmDeletes', 'true');

      const res = await fetch('/api/v1/items/import', { method: 'POST', body: formData });
      const json = await res.json();

      if (res.status === 409 && json.needsDeleteConfirmation) {
        setPendingDelete({ file, count: json.needsDeleteConfirmation.deleteCount });
        return;
      }

      if (!res.ok) {
        const details: string[] | undefined = json.details;
        let message = json.error || t('importFailed');
        if (details?.length) {
          const preview = details.slice(0, 3).join(' ');
          message += ` ${preview}`;
          if (details.length > 3) message += ` (+${details.length - 3} more)`;
        }
        setNotification({ type: 'error', message });
        return;
      }

      const r = json.data;
      let message = t('importSuccess', {
        created: r.created,
        updated: r.updated,
        deleted: r.deleted ?? 0,
        categoriesCreated: r.categoriesCreated,
        typesCreated: r.typesCreated,
        locationsCreated: r.locationsCreated,
        imagesFetched: r.imagesFetched,
        imagesSkipped: r.imagesSkipped,
      });
      if (r.rowErrors?.length) {
        message += ` ${t('importRowErrors', { count: r.rowErrors.length })}`;
      }
      setNotification({ type: r.rowErrors?.length ? 'error' : 'success', message });
      router.refresh();
    } catch {
      setNotification({ type: 'error', message: t('importFailed') });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />
      <Button
        disabled={isImporting}
        title={isImporting ? t('importing') : t('importHint')}
        style={{ background: 'var(--color-success)' }}
        onClick={() => inputRef.current?.click()}
      >
        <ArrowUpTrayIcon style={{ width: '18px', height: '18px' }} />
        {isImporting ? t('importing') : t('importExcel')}
      </Button>

      {/* Shown for the whole import: closing or leaving the app mid-import
          cuts it off. Fixed so it doesn't disturb the toolbar layout. */}
      {isImporting && (
        <div
          role="status"
          style={{ position: 'fixed', left: '50%', bottom: 'var(--spacing-lg)', transform: 'translateX(-50%)', zIndex: 1000, width: 'max-content', maxWidth: 'calc(100vw - 2 * var(--spacing-md))', padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid var(--color-warning)', background: 'color-mix(in srgb, var(--color-warning) 12%, var(--color-surface))', color: 'var(--color-warning)', fontWeight: 'var(--font-weight-bold)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,.15))' }}
        >
          {t('importingWarning')}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          message={t('importConfirmDelete', { count: pendingDelete.count })}
          confirmLabel={t('importConfirmDeleteConfirm')}
          cancelLabel={t('importConfirmDeleteCancel')}
          onConfirm={() => {
            const { file } = pendingDelete;
            setPendingDelete(null);
            runImport(file, true);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {notification && (
        <Toast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          durationMs={8000}
        />
      )}
    </>
  );
}
