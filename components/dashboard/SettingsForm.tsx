// components/dashboard/SettingsForm.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { updateStorefrontSettingFieldAction } from '@/app/lib/actions/settings';
import { Toggle } from '@/components/ui/Toggle';
import { CharCountTextarea } from '@/components/ui/CharCountTextarea';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Settings } from '@/app/lib/definitions';
import { resolveLabel } from '@/app/lib/labels';
import { Squares2X2Icon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import { FeaturedItemsSection } from './FeaturedItemsSection';
import type { FeaturedItem } from './AddFeaturedItemsModal';
import { PackageVisibilitySection, type VisibilityPackage } from './PackageVisibilitySection';
import { WhatsAppIcon } from '@/components/storefront/WhatsAppIcon';
import { TelegramIcon } from '@/components/storefront/TelegramIcon';
import { EmailIcon } from '@/components/storefront/EmailIcon';
import { InstagramIcon } from '@/components/storefront/InstagramIcon';

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
  const [contactTelegram, setContactTelegram] = useState(settings.contact_telegram ?? '');
  const [contactEmail, setContactEmail] = useState(settings.contact_email ?? '');
  const [contactInstagram, setContactInstagram] = useState(settings.contact_instagram ?? '');
  // Identity + announcement — same save-on-blur pattern as the contact
  // fields above, replacing the old batch-saved-via-Save-button trio.
  const [storefrontName, setStorefrontName] = useState(settings.storefront_name ?? '');
  const [storefrontTagline, setStorefrontTagline] = useState(settings.storefront_tagline ?? '');
  const [showMessage, setShowMessage] = useState(settings.show_message ?? '');

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

  // One row per contact channel (WhatsApp today; more can drop in here
  // later — see the spare_text_N columns reserved for exactly this in
  // app/api/setup/route.ts, and the Settings type). Every channel is the
  // same shape: brand icon + label, one free-text field, save-on-blur.
  // There's deliberately no per-channel toggle — a blank field just doesn't
  // render its button on the storefront, so "show_contact" below only ever
  // needs to be one master switch for however many channels are filled in,
  // not one per channel. Adding a channel later is: a new useState for its
  // local value, a translation entry, and one more call to this function.
  function contactChannelRow({
    icon,
    labelKey,
    hintKey,
    placeholderKey,
    name,
    value,
    onChange,
    onBlur,
  }: {
    icon: React.ReactNode;
    labelKey: string;
    hintKey: string;
    placeholderKey: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
  }) {
    return (
      <div className="settings-row" key={name}>
        <Tooltip text={t(hintKey)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            {icon}
            {t(labelKey)}
          </span>
        </Tooltip>
        <div className="settings-row-controls">
          {statusFor(name)}
          <input
            type="text"
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={t(placeholderKey)}
            className="sheet-input settings-row-control"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Identity comes first — it's the first thing a new tenant should
          fill in, ahead of visibility toggles and layout tweaks. No <form>
          here any more — every field below autosaves on its own (blur for
          text, instant for toggles elsewhere on this page), same as
          Contact Methods below it. */}
      <div className="settings-section">
        <div className="settings-section-title">{t('sectionIdentity')}</div>
        <div className="settings-group">
          <div className="settings-row">
            <span>{t('storefrontName')}</span>
            <div className="settings-row-controls">
              {statusFor('storefront_name')}
              <input
                type="text"
                name="storefront_name"
                value={storefrontName}
                onChange={(e) => setStorefrontName(e.target.value)}
                onBlur={() => {
                  if (storefrontName === (settings.storefront_name ?? '')) return;
                  autoSave('storefront_name', storefrontName);
                }}
                maxLength={255}
                placeholder={t('storefrontNamePlaceholder')}
                className="sheet-input settings-row-control"
              />
            </div>
          </div>
          <div className="settings-row">
            <span>{t('storefrontTagline')}</span>
            <div className="settings-row-controls">
              {statusFor('storefront_tagline')}
              <input
                type="text"
                name="storefront_tagline"
                value={storefrontTagline}
                onChange={(e) => setStorefrontTagline(e.target.value)}
                onBlur={() => {
                  if (storefrontTagline === (settings.storefront_tagline ?? '')) return;
                  autoSave('storefront_tagline', storefrontTagline);
                }}
                maxLength={255}
                placeholder={t('storefrontTaglinePlaceholder')}
                className="sheet-input settings-row-control"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionAnnouncement')}</div>
        <div className="settings-group" style={{ display: 'block', padding: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{t('showMessage')}</span>
            {statusFor('show_message')}
          </div>
          <div style={{ marginTop: 'var(--spacing-xs)' }}>
            <CharCountTextarea
              name="show_message"
              value={showMessage}
              onChange={setShowMessage}
              onBlur={() => {
                if (showMessage === (settings.show_message ?? '')) return;
                autoSave('show_message', showMessage);
              }}
              maxLength={SHOW_MESSAGE_MAX_LENGTH}
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionContactMethods')}</div>
        <div className="settings-group">
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
          {contactChannelRow({
            icon: <WhatsAppIcon size={20} />,
            labelKey: 'contactWhatsapp',
            hintKey: 'contactWhatsappHint',
            placeholderKey: 'contactWhatsappPlaceholder',
            name: 'contact_whatsapp',
            value: contactWhatsapp,
            onChange: setContactWhatsapp,
            onBlur: () => {
              if (contactWhatsapp === (settings.contact_whatsapp ?? '')) return;
              autoSave('contact_whatsapp', contactWhatsapp);
            },
          })}
          {contactChannelRow({
            icon: <TelegramIcon size={20} />,
            labelKey: 'contactTelegram',
            hintKey: 'contactTelegramHint',
            placeholderKey: 'contactTelegramPlaceholder',
            name: 'contact_telegram',
            value: contactTelegram,
            onChange: setContactTelegram,
            onBlur: () => {
              if (contactTelegram === (settings.contact_telegram ?? '')) return;
              autoSave('contact_telegram', contactTelegram);
            },
          })}
          {contactChannelRow({
            icon: <InstagramIcon size={20} />,
            labelKey: 'contactInstagram',
            hintKey: 'contactInstagramHint',
            placeholderKey: 'contactInstagramPlaceholder',
            name: 'contact_instagram',
            value: contactInstagram,
            onChange: setContactInstagram,
            onBlur: () => {
              if (contactInstagram === (settings.contact_instagram ?? '')) return;
              autoSave('contact_instagram', contactInstagram);
            },
          })}
          {contactChannelRow({
            icon: <EmailIcon size={20} />,
            labelKey: 'contactEmail',
            hintKey: 'contactEmailHint',
            placeholderKey: 'contactEmailPlaceholder',
            name: 'contact_email',
            value: contactEmail,
            onChange: setContactEmail,
            onBlur: () => {
              if (contactEmail === (settings.contact_email ?? '')) return;
              autoSave('contact_email', contactEmail);
            },
          })}
          {/* More channels go here as more contactChannelRow(...) calls,
              each with its own useState above and its own spare_text_N
              column (see app/api/setup/route.ts) — same shape, no
              per-channel toggle needed. */}
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
