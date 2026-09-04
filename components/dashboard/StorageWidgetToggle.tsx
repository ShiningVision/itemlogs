'use client';

// DEAD CODE — was StorageDonutWidget.tsx's on/off toggle; the whole storage
// widget feature was removed. No longer imported anywhere. Safe to delete
// this file entirely — kept only because file deletion isn't available in
// this environment.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { updateDashboardWidgetFieldAction } from '@/app/lib/actions/settings';
import { Toggle } from '@/components/ui/Toggle';

// Unlike StorefrontLiveToggle, flipping this on doesn't just change how
// already-fetched data is displayed — it changes whether the (relatively
// expensive, see blob-usage.ts) Blob usage scan runs at all. So this can't
// mirror local optimistic state the way that toggle does; it has to save,
// then router.refresh() so StorageDonutWidget (a server component) actually
// re-fetches now that show_dashboard_storage_widget is true, and Next
// re-renders it with real data instead of the "enable this" placeholder.
export function StorageWidgetToggle({ defaultChecked }: { defaultChecked: boolean }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [checked, setChecked] = useState(defaultChecked);
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked;
    setChecked(next);
    startTransition(async () => {
      const result = await updateDashboardWidgetFieldAction('show_dashboard_storage_widget', next);
      if (result && 'error' in result) {
        setChecked(!next);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Toggle
      key={String(checked)}
      name="show_dashboard_storage_widget"
      defaultChecked={checked}
      disabled={pending}
      label={t('chartStorageToggleLabel')}
      onChange={handleChange}
    />
  );
}
