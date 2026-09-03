// components/dashboard/OnboardingChecklist.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Settings } from '@/app/lib/definitions';
import { syncOnboardingChecklist } from '@/app/lib/services/settings';

export async function OnboardingChecklist({ settings }: { settings: Settings }) {
  const t = await getTranslations('dashboard');

  // All six steps are sticky booleans on `settings` — once true, they stay
  // true, even if the tenant later deletes their only real item or turns
  // the storefront back off. Order here is the actual, deliberate onboarding
  // narrative (not just insertion order): get something in the inventory,
  // make sure visitors can reach you, give the shop an identity, tidy it up,
  // put a face on it, then flip it on. "Share your link" is deliberately
  // NOT a step here — it's a one-off action once live, not a state to track,
  // so it lives in QuickActions instead (see DashboardPage).
  const steps = [
    {
      key: 'addItem',
      done: settings.checklist_added_item,
      label: t('checklistAddItem'),
      href: '/dashboard/items',
    },
    {
      key: 'addContact',
      done: settings.checklist_added_contact,
      label: t('checklistAddContact'),
      href: '/dashboard',
    },
    {
      key: 'nameStorefront',
      done: settings.checklist_named_storefront,
      label: t('checklistNameStorefront'),
      href: '/dashboard',
    },
    {
      key: 'organize',
      done: settings.checklist_organized,
      label: t('checklistOrganize'),
      // Categories/types/locations are managed from the items page's
      // filter section (see components/reference-data/ManageFiltersModal.tsx)
      // — there's no standalone route for them.
      href: '/dashboard/items',
    },
    {
      key: 'pickTheme',
      done: settings.checklist_picked_theme,
      label: t('checklistPickTheme'),
      href: '/dashboard/themes',
    },
    {
      key: 'goLive',
      done: settings.checklist_went_live,
      label: t('checklistGoLive'),
      href: '/dashboard',
    },
  ];

  // Synced before rendering so the very same load that ticks a step off
  // also shows it ticked, rather than lagging a page load behind.
  const synced = await syncOnboardingChecklist(settings);
  const resolvedSteps = steps.map((step) => ({
    ...step,
    done:
      step.key === 'addItem' ? synced.checklist_added_item
      : step.key === 'addContact' ? synced.checklist_added_contact
      : step.key === 'nameStorefront' ? synced.checklist_named_storefront
      : step.key === 'organize' ? synced.checklist_organized
      : step.key === 'pickTheme' ? synced.checklist_picked_theme
      : synced.checklist_went_live,
  }));

  const doneCount = resolvedSteps.filter((s) => s.done).length;
  if (doneCount === resolvedSteps.length) return null;

  return (
    <div className="dashboard-card dashboard-checklist">
      <div className="dashboard-checklist-header">
        <h2 className="dashboard-card-title">{t('checklistTitle')}</h2>
        <span className="dashboard-checklist-progress-label">
          {t('checklistProgress', { done: doneCount, total: resolvedSteps.length })}
        </span>
      </div>
      <div className="dashboard-checklist-progress-track" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={resolvedSteps.length}>
        <div
          className="dashboard-checklist-progress-fill"
          style={{ width: `${(doneCount / resolvedSteps.length) * 100}%` }}
        />
      </div>
      <ul className="dashboard-checklist-list">
        {resolvedSteps.map((step) => (
          <li key={step.key} className="dashboard-checklist-item">
            <Link
              href={step.href}
              className={`dashboard-checklist-link${step.done ? ' dashboard-checklist-link--done' : ''}`}
            >
              <span className={`dashboard-checklist-box${step.done ? ' dashboard-checklist-box--done' : ''}`} aria-hidden="true">
                {step.done && (
                  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                    <path d="M3 8.5L6.5 12L13 4.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
