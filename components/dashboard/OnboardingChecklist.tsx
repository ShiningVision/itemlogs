// components/dashboard/OnboardingChecklist.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Settings } from '@/app/lib/definitions';
import { hasRealItem } from '@/app/lib/services/items';

export async function OnboardingChecklist({ settings }: { settings: Settings }) {
  const t = await getTranslations('dashboard');

  const [addedItem] = await Promise.all([hasRealItem()]);
  const namedStorefront = Boolean(settings.storefront_name && settings.storefront_name.trim());
  const storefrontLive = Boolean(settings.show);

  const steps = [
    {
      key: 'addItem',
      done: addedItem,
      label: t('checklistAddItem'),
      href: '/dashboard/items',
    },
    {
      key: 'nameStorefront',
      done: namedStorefront,
      label: t('checklistNameStorefront'),
      href: '/dashboard',
    },
    {
      key: 'goLive',
      done: storefrontLive,
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
