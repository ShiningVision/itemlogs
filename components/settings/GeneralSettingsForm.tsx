// components/settings/GeneralSettingsForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateGeneralSettingFieldAction, updateNameSettingsAction } from '@/app/lib/actions/settings';
import { Button } from '@/widgets/Button';
import { Toggle } from '@/components/ui/Toggle';
import type { Settings } from '@/app/lib/definitions';

type Currency = { id: number; currency_code: string; currency_name: string };
type Language = { id: number; name: string };

const FUNCTIONALITY_FIELDS: Array<{ key: keyof Settings; labelKey: string }> = [
  { key: 'use_sell_price', labelKey: 'useSellPrice' },
  { key: 'use_barcode', labelKey: 'useBarcode' },
  { key: 'use_package_fee_distribution', labelKey: 'usePackageFeeDistribution' },
];

const PREFERENCE_TOGGLE_FIELDS: Array<{ key: keyof Settings; labelKey: string }> = [
  { key: 'display_profit', labelKey: 'displayProfit' },
  { key: 'display_sell_price', labelKey: 'displaySellPrice' },
  { key: 'display_purchase_price', labelKey: 'displayPurchasePrice' },
  { key: 'display_cost_price', labelKey: 'displayCostPrice' },
];

const PREFERENCE_NAME_FIELDS: Array<{ key: keyof Settings; labelKey: string }> = [
  { key: 'name_category', labelKey: 'nameCategory' },
  { key: 'name_type', labelKey: 'nameType' },
  { key: 'name_status', labelKey: 'nameStatus' },
  { key: 'name_package', labelKey: 'namePackage' },
  { key: 'name_item', labelKey: 'nameItem' },
];

type FieldStatus = 'saving' | 'saved' | 'error';

export function GeneralSettingsForm({
  settings,
  currencies,
  languages,
}: {
  settings: Settings;
  currencies: Currency[];
  languages: Language[];
}) {
  const t = useTranslations('generalSettings');
  const [, startAutosaveTransition] = useTransition();
  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>({});

  const [isNamesPending, startNamesTransition] = useTransition();
  const [namesMessage, setNamesMessage] = useState<string | null>(null);

  function autoSave(key: string, value: string | number | boolean) {
    setFieldStatus((s) => ({ ...s, [key]: 'saving' }));
    startAutosaveTransition(async () => {
      const result = await updateGeneralSettingFieldAction(key as any, value);
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

  function handleNamesSubmit(formData: FormData) {
    startNamesTransition(async () => {
      const result = await updateNameSettingsAction(formData);
      setNamesMessage(result && 'error' in result ? t('saveFailed') : t('saved'));
    });
  }

  return (
    <div>
      <div className="settings-section">
        <div className="settings-section-title">{t('sectionDefaults')}</div>
        <div className="settings-group">
          <div className="settings-row">
            <span>{t('sellPriceCurrency')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              {statusFor('sell_price_currency')}
              <select
                defaultValue={settings.sell_price_currency}
                onChange={(e) => autoSave('sell_price_currency', Number(e.target.value))}
                className="sheet-input settings-row-control"
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.currency_code} — {c.currency_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="settings-row">
            <span>{t('defaultPurchasePriceCurrency')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              {statusFor('default_purchase_price_currency')}
              <select
                defaultValue={settings.default_purchase_price_currency}
                onChange={(e) => autoSave('default_purchase_price_currency', Number(e.target.value))}
                className="sheet-input settings-row-control"
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.currency_code} — {c.currency_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="settings-row">
            <span>{t('language')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              {statusFor('language')}
              <select
                defaultValue={settings.language}
                onChange={(e) => autoSave('language', Number(e.target.value))}
                className="sheet-input settings-row-control"
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionFunctionality')}</div>
        <div className="settings-group">
          {FUNCTIONALITY_FIELDS.map(({ key, labelKey }) => (
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
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionPreferences')}</div>

        <div className="settings-group" style={{ marginBottom: 'var(--spacing-md)' }}>
          {PREFERENCE_TOGGLE_FIELDS.map(({ key, labelKey }) => (
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

        <form action={handleNamesSubmit} className="settings-group">
          {PREFERENCE_NAME_FIELDS.map(({ key, labelKey }) => (
            <div key={key} className="settings-row">
              <span>{t(labelKey)}</span>
              <input
                type="text"
                name={key}
                defaultValue={(settings[key] as string) ?? ''}
                placeholder={t(`${labelKey}Placeholder`)}
                className="sheet-input settings-row-control"
              />
            </div>
          ))}

          <div className="settings-group-footer">
            <Button type="submit" disabled={isNamesPending}>
              {isNamesPending ? t('saving') : t('save')}
            </Button>
            {namesMessage && (
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{namesMessage}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
