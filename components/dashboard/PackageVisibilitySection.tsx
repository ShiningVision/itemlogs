// components/dashboard/PackageVisibilitySection.tsx
'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Toggle } from '@/components/ui/Toggle';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/widgets/Button';
import { updateStorefrontSettingFieldAction } from '@/app/lib/actions/settings';
import { AddPackagesModal } from './AddPackagesModal';

export type VisibilityPackage = { id: number; name: string; show_on_storefront: boolean };

// "Show on visitor page" used to be a toggle on each package's own edit
// form — easy to lose track of which packages were public without opening
// every one of them. This section replaces that with a single place to see
// every package currently shown, add or remove them via a select/deselect
// picker, and flip the "Filter by packages" switch that the whole feature
// depends on — same pattern as FeaturedItemsSection replacing the old
// per-item "featured" toggle.
export function PackageVisibilitySection({
  packages,
  packageLabel,
  defaultShowPackageFilter,
  defaultNamePackage,
}: {
  packages: VisibilityPackage[];
  packageLabel: string;
  defaultShowPackageFilter: boolean;
  defaultNamePackage: string | null;
}) {
  const t = useTranslations('dashboard');
  const [items, setItems] = useState<VisibilityPackage[]>(packages);
  const [showPackageFilter, setShowPackageFilter] = useState(defaultShowPackageFilter);
  const [toggleStatus, setToggleStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
  const [namePackage, setNamePackage] = useState(defaultNamePackage ?? '');
  const [nameStatus, setNameStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
  const [, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  function handleToggleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setShowPackageFilter(checked);
    setToggleStatus('saving');
    startTransition(async () => {
      const result = await updateStorefrontSettingFieldAction('show_package_filter', checked);
      setToggleStatus(result && 'error' in result ? 'error' : 'saved');
      setTimeout(() => setToggleStatus(null), 1500);
    });
  }

  // Text field, so it saves on blur rather than per keystroke like the
  // toggles above — same as every other autosaved text input in Visitor
  // Page Settings (e.g. the announcement message).
  function handleNamePackageBlur() {
    if (namePackage === (defaultNamePackage ?? '')) return;
    setNameStatus('saving');
    startTransition(async () => {
      const result = await updateStorefrontSettingFieldAction('name_package', namePackage);
      setNameStatus(result && 'error' in result ? 'error' : 'saved');
      setTimeout(() => setNameStatus(null), 1500);
    });
  }

  async function handleRemove(id: number) {
    setRemovingId(id);
    setRemoveError(null);
    const previous = items;
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, show_on_storefront: false } : p)));
    try {
      const res = await fetch(`/api/v1/packages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_on_storefront: false }),
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

  function handleAdded(addedIds: number[]) {
    setItems((prev) => prev.map((p) => (addedIds.includes(p.id) ? { ...p, show_on_storefront: true } : p)));
  }

  const shownPackages = items.filter((p) => p.show_on_storefront);
  const hiddenPackages = items.filter((p) => !p.show_on_storefront);

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t('sectionPackageVisibility', { packages: packageLabel })}</div>
      <div className="settings-group">
        <div className="settings-row">
          <span>{t('namePackage')}</span>
          <div className="settings-row-controls">
            {nameStatus && (
              <span className="settings-row-status" style={nameStatus === 'error' ? { color: 'var(--color-danger)' } : undefined}>
                {nameStatus === 'saving' ? t('saving') : nameStatus === 'error' ? t('saveFailed') : t('saved')}
              </span>
            )}
            <input
              type="text"
              name="name_package"
              value={namePackage}
              onChange={(e) => setNamePackage(e.target.value)}
              onBlur={handleNamePackageBlur}
              placeholder={t('namePackagePlaceholder')}
              className="sheet-input settings-row-control"
            />
          </div>
        </div>

        <div className="settings-row">
          <Tooltip text={t('showPackageFilterHint', { packages: packageLabel })}>
            <span>{t('showPackageFilter', { packages: packageLabel })}</span>
          </Tooltip>
          <div className="settings-row-controls">
            {toggleStatus && (
              <span className="settings-row-status" style={toggleStatus === 'error' ? { color: 'var(--color-danger)' } : undefined}>
                {toggleStatus === 'saving' ? t('saving') : toggleStatus === 'error' ? t('saveFailed') : t('saved')}
              </span>
            )}
            <Toggle
              name="show_package_filter"
              defaultChecked={showPackageFilter}
              label={t('showPackageFilter', { packages: packageLabel })}
              onChange={handleToggleChange}
            />
          </div>
        </div>

        <div style={{ padding: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              {t('packagesShownCount', { count: shownPackages.length })}
            </span>
            <Button type="button" onClick={() => setAddModalOpen(true)} disabled={hiddenPackages.length === 0}>
              {t('addPackagesButton', { packages: packageLabel })}
            </Button>
          </div>

          {removeError && (
            <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
              {removeError}
            </div>
          )}

          {shownPackages.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              {t('noPackagesForVisibility', { packages: packageLabel })}
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
              {shownPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    opacity: removingId === pkg.id ? 0.5 : 1,
                  }}
                >
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>{pkg.name}</span>
                  <Tooltip text={t('removePackageFromStorefront')}>
                    <button
                      type="button"
                      onClick={() => handleRemove(pkg.id)}
                      disabled={removingId === pkg.id}
                      aria-label={t('removePackageFromStorefront')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '18px',
                        height: '18px',
                        background: 'transparent',
                        border: 'none',
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
        <AddPackagesModal
          packages={hiddenPackages}
          packageLabel={packageLabel}
          onClose={() => setAddModalOpen(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
