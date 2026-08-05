// components/dashboard/OnboardingChecklist.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Settings } from '@/app/lib/definitions';
import { syncOnboardingChecklist } from '@/app/lib/services/settings';

export async function OnboardingChecklist({ settings }: { settings: Settings }) {
  const t = await getTranslations('dashboard');

  // All three steps are sticky booleans on `settings` — once true, they
  // stay true, even if the tenant later deletes their only real item or
  // turns the storefront back off.
  const synced = await syncOnboardingChecklist(settings);

  const steps = [
    {
      key: 'addItem',
      done: synced.checklist_added_item,
      label: t('checklistAddItem'),
      href: '/dashboard/items',
    },
    {
      key: 'nameStorefront',
      done: synced.checklist_named_storefront,
      label: t('checklistNameStorefront'),
      href: '/dashboard',
    },
    {
      key: 'goLive',
      done: synced.checklist_went_live,
      label: t('checklistGoLive'),
      href: '/dashboard',
    },
  ];

  const remaining = steps.filter((s) => !s.done);
  if (remaining.length === 0) return null;

  return (
    <div className="dashboard-card dashboard-checklist">
      <h2 className="dashboard-card-title">{t('checklistTitle')}</h2>
      <ul className="dashboard-checklist-list">
        {remaining.map((step) => (
          <li key={step.key} className="dashboard-checklist-item">
            <Link href={step.href} className="dashboard-checklist-link">
              <span className="dashboard-checklist-box" aria-hidden="true" />
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
