// components/dashboard/SettingsForm.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { updateStorefrontSettingFieldAction, updateStorefrontTextSettingsAction } from '@/app/lib/actions/settings';
import { Button } from '@/widgets/Button';
import { Toggle } from '@/components/ui/Toggle';
import { CharCountTextarea } from '@/components/ui/CharCountTextarea';
import Link from 'next/link';
import type { Settings } from '@/app/lib/definitions';

const SHOW_MESSAGE_MAX_LENGTH = 255;

const VISIBILITY_FIELDS: Array<{ key: keyof Settings; labelKey: string }> = [
  { key: 'show', labelKey: 'show' },
  { key: 'show_status_1', labelKey: 'showStatus1' },
  { key: 'show_status_2', labelKey: 'showStatus2' },
  { key: 'show_status_3', labelKey: 'showStatus3' },
  { key: 'show_status_4', labelKey: 'showStatus4' },
  { key: 'show_contact', labelKey: 'showContact' },
];

const ITEM_DETAIL_FIELDS: Array<{ key: keyof Settings; labelKey: string }> = [
  { key: 'show_sell_price', labelKey: 'showSellPrice' },
  { key: 'show_purchase_price', labelKey: 'showPurchasePrice' },
  { key: 'show_cost_price', labelKey: 'showCostPrice' },
  { key: 'show_origin', labelKey: 'showOrigin' },
];

type FieldStatus = 'saving' | 'saved' | 'error';

export function SettingsForm({ settings }: { settings: Settings }) {
  const t = useTranslations('dashboard');
  const [, startAutosaveTransition] = useTransition();
  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>({});

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

  const toggleGroup = (fields: Array<{ key: keyof Settings; labelKey: string }>) => (
    <div className="settings-group">
      {fields.map(({ key, labelKey }) => (
        <div key={key} className="settings-row">
          <span>{t(labelKey)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            {statusFor(key)}
            <Toggle
              name={key}
              defaultChecked={Boolean(settings[key])}
              label={t(labelKey)}
              onChange={(e) => autoSave(key, e.target.checked)}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="settings-section">
        <div className="settings-section-title">{t('sectionVisibility')}</div>
        {toggleGroup(VISIBILITY_FIELDS)}
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionItemDetails')}</div>
        {toggleGroup(ITEM_DETAIL_FIELDS)}
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionLayout')}</div>
        <div className="settings-group">
          <div className="settings-row">
            <span>{t('storefrontDensity')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              {statusFor('storefront_density')}
              <select
                defaultValue={settings.storefront_density ?? 'dense'}
                onChange={(e) => autoSave('storefront_density', e.target.value)}
                className="sheet-input settings-row-control"
              >
                <option value="dense">{t('densityDense')}</option>
                <option value="showcase">{t('densityShowcase')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

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
          <div className="settings-section-title">{t('sectionContactInfo')}</div>
          <div className="settings-group">
            <div className="settings-row">
              <span>{t('contactInfo')}</span>
              <input
                type="text"
                name="contact_info"
                defaultValue={settings.contact_info ?? ''}
                maxLength={255}
                placeholder={t('contactInfoPlaceholder')}
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

        <div className="settings-group-footer">
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
    </div>
  );
}
