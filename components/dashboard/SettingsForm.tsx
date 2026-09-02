// components/dashboard/SettingsForm.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { updateStorefrontSettingFieldAction, updateStorefrontTextSettingsAction } from '@/app/lib/actions/settings';
import { Button } from '@/widgets/Button';
import { Toggle } from '@/components/ui/Toggle';
import { CharCountTextarea } from '@/components/ui/CharCountTextarea';
import { Tooltip } from '@/components/ui/Tooltip';
import Link from 'next/link';
import type { Settings } from '@/app/lib/definitions';
import { resolveLabel } from '@/app/lib/labels';
import { Squares2X2Icon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import { FeaturedItemsSection } from './FeaturedItemsSection';
import type { FeaturedItem } from './AddFeaturedItemsModal';
import { PackageVisibilitySection, type VisibilityPackage } from './PackageVisibilitySection';

const SHOW_MESSAGE_MAX_LENGTH = 255;

const VISIBILITY_FIELDS: Array<{ key: keyof Settings; labelKey: string; hintKey: string }> = [
  // 'show' (the storefront on/off switch) lives in the dashboard's
  // storefront live-status card now, not here — see StorefrontLiveToggle.
  { key: 'show_status_1', labelKey: 'showStatus1', hintKey: 'showStatus1Hint' },
  { key: 'show_status_2', labelKey: 'showStatus2', hintKey: 'showStatus2Hint' },
  { key: 'show_status_3', labelKey: 'showStatus3', hintKey: 'showStatus3Hint' },
  { key: 'show_status_4', labelKey: 'showStatus4', hintKey: 'showStatus4Hint' },
];

const ITEM_DETAIL_FIELDS: Array<{ key: keyof Settings; labelKey: string; hintKey: string }> = [
  { key: 'show_sell_price', labelKey: 'showSellPrice', hintKey: 'showSellPriceHint' },
  { key: 'show_purchase_price', labelKey: 'showPurchasePrice', hintKey: 'showPurchasePriceHint' },
  { key: 'show_cost_price', labelKey: 'showCostPrice', hintKey: 'showCostPriceHint' },
  { key: 'show_location', labelKey: 'showLocation', hintKey: 'showLocationHint' },
  // Not inverted: on for new tenants via the setup route's INSERT, off by
  // default for already-provisioned ones, same as every other field here.
  { key: 'show_description', labelKey: 'showDescription', hintKey: 'showDescriptionHint' },
];

type FieldStatus = 'saving' | 'saved' | 'error';

export function SettingsForm({
  settings,
  featuredItems,
  featuredItemCap,
  visibilityPackages,
}: {
  settings: Settings;
  featuredItems: FeaturedItem[];
  featuredItemCap: number;
  visibilityPackages: VisibilityPackage[];
}) {
  const t = useTranslations('dashboard');
  const packageLabel = resolveLabel(settings.name_package, t('packageNameFallback'));
  const [, startAutosaveTransition] = useTransition();
  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>({});
  const [storefrontDensity, setStorefrontDensity] = useState(settings.storefront_density ?? 'dense');
  // Local value for the WhatsApp number — same save-on-blur pattern as
  // name_package below (onBlur is what actually persists a change; this is
  // just what the input needs to be a controlled field).
  const [contactWhatsapp, setContactWhatsapp] = useState(settings.contact_whatsapp ?? '');

  const [isTextPending, startTextTransition] = useTransition();
  const [textMessage, setTextMessage] = useState<string | null>(null);

  function autoSave(key: string, value: string | number | boolean) {
    setFieldStatus((s) => ({ ...s, [key]: 'saving' }));
    startAutosaveTransition(async () => {
      const result = await updateStorefrontSettingFieldAction(key as any, value);
      setFieldStatus((s) => ({ ...s, [key]: result && 'error' in result ? 'error' : 'saved' }));
      setTimeout(() => {
        setFieldStatus((s) => {
          const { [key]: _omit, ...rest } = s;
          return rest;
        });
      }, 1500);
    });
  }

  function statusFor(key: string) {
    const status = fieldStatus[key];
    if (!status) return null;
    const text = status === 'saving' ? t('saving') : status === 'error' ? t('saveFailed') : t('saved');
    return (
      <span className="settings-row-status" style={status === 'error' ? { color: 'var(--color-danger)' } : undefined}>
        {text}
      </span>
    );
  }

  function handleTextSubmit(formData: FormData) {
    startTextTransition(async () => {
      const result = await updateStorefrontTextSettingsAction(formData);
      setTextMessage(result && 'error' in result ? t('saveFailed') : t('saved'));
    });
  }

  // Bare rows, with no wrapping .settings-group card — lets a section combine
  // a static list of toggle fields with a one-off custom row (e.g. the
  // package-filter toggle below, which needs an interpolated label) inside
  // a single shared card, instead of each getting its own bordered box.
  const toggleRows = (fields: Array<{ key: keyof Settings; labelKey: string; hintKey: string }>) =>
    fields.map(({ key, labelKey, hintKey }) => (
      <div key={key} className="settings-row">
        <Tooltip text={t(hintKey)}>
          <span>{t(labelKey)}</span>
        </Tooltip>
        <div className="settings-row-controls">
          {statusFor(key)}
          <Toggle
            name={key}
            defaultChecked={Boolean(settings[key])}
            label={t(labelKey)}
            onChange={(e) => autoSave(key, e.target.checked)}
          />
        </div>
      </div>
    ));

  return (
    <div>
      {/* Identity comes first — it's the first thing a new tenant should
          fill in, ahead of visibility toggles and layout tweaks. */}
      <form action={handleTextSubmit}>
        <div className="settings-section">
          <div className="settings-section-title">{t('sectionIdentity')}</div>
          <div className="settings-group">
            <div className="settings-row">
              <span>{t('storefrontName')}</span>
              <input
                type="text"
                name="storefront_name"
                defaultValue={settings.storefront_name ?? ''}
                maxLength={255}
                placeholder={t('storefrontNamePlaceholder')}
                className="sheet-input settings-row-control"
              />
            </div>
            <div className="settings-row">
              <span>{t('storefrontTagline')}</span>
              <input
                type="text"
                name="storefront_tagline"
                defaultValue={settings.storefront_tagline ?? ''}
                maxLength={255}
                placeholder={t('storefrontTaglinePlaceholder')}
                className="sheet-input settings-row-control"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">{t('sectionAnnouncement')}</div>
          <div className="settings-group" style={{ display: 'block', padding: 'var(--spacing-sm)' }}>
            <span>{t('showMessage')}</span>
            <div style={{ marginTop: 'var(--spacing-xs)' }}>
              <CharCountTextarea
                name="show_message"
                defaultValue={settings.show_message ?? ''}
                maxLength={SHOW_MESSAGE_MAX_LENGTH}
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="settings-group-footer settings-group-footer--detached">
          <Button type="submit" disabled={isTextPending}>
            {isTextPending ? t('saving') : t('save')}
          </Button>
          {settings.show && (
            <Link href="/">
              <Button type="button">{t('goToStorefront')}</Button>
            </Link>
          )}
          {textMessage && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{textMessage}</span>
          )}
        </div>
      </form>

      {/* Contact Info lives outside the identity <form> above — both its
          fields autosave on their own (blur for the number, instant for
          the toggle), so it doesn't belong to that form's Save button, the
          same reasoning as PackageVisibilitySection/FeaturedItemsSection
          below living outside it too. */}
      <div className="settings-section">
        <div className="settings-section-title">{t('sectionContactInfo')}</div>
        <div className="settings-group">
          <div className="settings-row">
            <Tooltip text={t('contactWhatsappHint')}>
              <span>{t('contactWhatsapp')}</span>
            </Tooltip>
            <div className="settings-row-controls">
              {statusFor('contact_whatsapp')}
              <input
                type="text"
                name="contact_whatsapp"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === (settings.contact_whatsapp ?? '')) return;
                  autoSave('contact_whatsapp', e.target.value);
                }}
                placeholder={t('contactWhatsappPlaceholder')}
                className="sheet-input settings-row-control"
              />
            </div>
          </div>
          <div className="settings-row">
            <Tooltip text={t('showContactHint')}>
              <span>{t('showContact')}</span>
            </Tooltip>
            <div className="settings-row-controls">
              {statusFor('show_contact')}
              <Toggle
                name="show_contact"
                defaultChecked={Boolean(settings.show_contact)}
                label={t('showContact')}
                onChange={(e) => autoSave('show_contact', e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionVisibility')}</div>
        <div className="settings-group">
          {toggleRows(VISIBILITY_FIELDS)}
          <div className="settings-row">
            <Tooltip text={t('showLocationFilterHint')}>
              <span>{t('showLocationFilter')}</span>
            </Tooltip>
            <div className="settings-row-controls">
              {statusFor('show_location_filter')}
              <Toggle
                name="show_location_filter"
                defaultChecked={Boolean(settings.show_location_filter)}
                label={t('showLocationFilter')}
                onChange={(e) => autoSave('show_location_filter', e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* show_package_filter ("Filter by packages") lives here now instead
          of the plain Visibility list above — it's the on/off switch for
          the exact feature this section manages (which packages are
          selectable in that filter), so it belongs next to the picker, not
          separated from it. */}
      <PackageVisibilitySection
        packages={visibilityPackages}
        packageLabel={packageLabel}
        defaultShowPackageFilter={Boolean(settings.show_package_filter)}
        defaultNamePackage={settings.name_package}
      />

      <FeaturedItemsSection
        initialItems={featuredItems}
        cap={featuredItemCap}
        defaultShowFeatured={Boolean(settings.show_featured_items)}
      />

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionItemDetails')}</div>
        <div className="settings-group">{toggleRows(ITEM_DETAIL_FIELDS)}</div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionLayout')}</div>
        <div className="settings-group">
          <div className="settings-row">
            <span>{t('storefrontDensity')}</span>
            <div className="settings-row-controls">
              {statusFor('storefront_density')}
              {/* Only 2 real options here, so a <select> (with its extra
                  click to open + a dropdown popup for a single choice) was
                  more control than the decision needs — a segmented toggle
                  shows both options and the current one at a glance. Same
                  component pattern as the dashboard items page's own
                  density toggle (ItemDensityToggle), just wired to
                  autosave a setting instead of a URL param. */}
              <div className="density-toggle-group">
                <button
                  type="button"
                  className={`density-toggle-button${storefrontDensity === 'dense' ? ' density-toggle-button--active' : ''}`}
                  onClick={() => {
                    setStorefrontDensity('dense');
                    autoSave('storefront_density', 'dense');
                  }}
                >
                  <Squares2X2Icon style={{ width: '14px', height: '14px' }} />
                  {t('densityDense')}
                </button>
                <button
                  type="button"
                  className={`density-toggle-button${storefrontDensity === 'showcase' ? ' density-toggle-button--active' : ''}`}
                  onClick={() => {
                    setStorefrontDensity('showcase');
                    autoSave('storefront_density', 'showcase');
                  }}
                >
                  <ViewColumnsIcon style={{ width: '14px', height: '14px' }} />
                  {t('densityShowcase')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
