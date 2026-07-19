// components/items/ImportExcelButton.tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/widgets/Button';
import { Toast, type ToastType } from '@/components/ui/notification';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export function ImportExcelButton() {
  const t = useTranslations('items');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [notification, setNotification] = useState<{ type: ToastType; message: string } | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setIsImporting(true);
    setNotification(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/items/import', { method: 'POST', body: formData });
      const json = await res.json();

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
        categoriesCreated: r.categoriesCreated,
        typesCreated: r.typesCreated,
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
