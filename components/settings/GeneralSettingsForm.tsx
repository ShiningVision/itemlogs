// components/settings/GeneralSettingsForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateGeneralSettingFieldAction } from '@/app/lib/actions/settings';
import { Toggle } from '@/components/ui/Toggle';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Settings } from '@/app/lib/definitions';

type Currency = { id: number; currency_code: string; currency_name: string };
type Language = { id: number; name: string };

const FUNCTIONALITY_FIELDS: Array<{ key: keyof Settings; labelKey: string; hintKey: string }> = [
  { key: 'use_sell_price', labelKey: 'useSellPrice', hintKey: 'useSellPriceHint' },
  { key: 'use_barcode', labelKey: 'useBarcode', hintKey: 'useBarcodeHint' },
  { key: 'use_package_fees', labelKey: 'usePackageFees', hintKey: 'usePackageFeesHint' },
  { key: 'use_secret_notes', labelKey: 'useSecretNotes', hintKey: 'useSecretNotesHint' },
];

const PREFERENCE_TOGGLE_FIELDS: Array<{ key: keyof Settings; labelKey: string; hintKey: string }> = [
  { key: 'display_profit', labelKey: 'displayProfit', hintKey: 'displayProfitHint' },
  { key: 'display_sell_price', labelKey: 'displaySellPrice', hintKey: 'displaySellPriceHint' },
  { key: 'display_purchase_price', labelKey: 'displayPurchasePrice', hintKey: 'displayPurchasePriceHint' },
  { key: 'display_cost_price', labelKey: 'displayCostPrice', hintKey: 'displayCostPriceHint' },
];

const PREFERENCE_NAME_FIELDS: Array<{ key: keyof Settings; labelKey: string; hintKey: string }> = [
  { key: 'name_category', labelKey: 'nameCategory', hintKey: 'nameCategoryHint' },
  { key: 'name_type', labelKey: 'nameType', hintKey: 'nameTypeHint' },
  { key: 'name_status', labelKey: 'nameStatus', hintKey: 'nameStatusHint' },
  { key: 'name_location', labelKey: 'nameLocation', hintKey: 'nameLocationHint' },
  // name_package moved to the dashboard's Visitor Page Settings ->
  // Package Visibility section (PackageVisibilitySection) — it only ever
  // affects the visitor page, unlike the fields left here (which affect
  // both the dashboard and the visitor page).
  // name_item is intentionally hidden — nothing in the app reads it, so
  // this field currently has zero visible effect. Left in the database,
  // validation schema, and the save action untouched; only hidden here.
  // Re-add { key: 'name_item', labelKey: 'nameItem', hintKey: 'nameItemHint' }
  // once something actually renders it.
  // { key: 'name_item', labelKey: 'nameItem', hintKey: 'nameItemHint' },
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
  // Local values for the free-text name-override fields — needed so onBlur
  // has something to read (unlike the toggles/selects above, whose native
  // onChange event already carries the new value). Initialized from
  // `settings`; each field's own onBlur is what actually persists a change.
  const [nameValues, setNameValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(PREFERENCE_NAME_FIELDS.map(({ key }) => [key, (settings[key] as string) ?? '']))
  );

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

  return (
    <div>
      <div className="settings-section">
        <div className="settings-section-title">{t('sectionDefaults')}</div>
        <div className="settings-group">
          <div className="settings-row">
            <Tooltip text={t('sellPriceCurrencyHint')}>
              <span>{t('sellPriceCurrency')}</span>
            </Tooltip>
            <div className="settings-row-controls">
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
            <Tooltip text={t('defaultPurchasePriceCurrencyHint')}>
              <span>{t('defaultPurchasePriceCurrency')}</span>
            </Tooltip>
            <div className="settings-row-controls">
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
            <div className="settings-row-controls">
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
          {FUNCTIONALITY_FIELDS.map(({ key, labelKey, hintKey }) => (
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
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionPreferences')}</div>

        <div className="settings-group">
          {PREFERENCE_TOGGLE_FIELDS.map(({ key, labelKey, hintKey }) => (
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
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t('sectionCustomTerminology')}</div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: '0 0 var(--spacing-sm)' }}>
          {t('customTerminologyIntro')}
        </p>

        <div className="settings-group">
          {PREFERENCE_NAME_FIELDS.map(({ key, labelKey, hintKey }) => (
            <div key={key} className="settings-row">
              <Tooltip text={t(hintKey)}>
                <span>{t(labelKey)}</span>
              </Tooltip>
              <div className="settings-row-controls">
                {statusFor(key)}
                <input
                  type="text"
                  name={key}
                  value={nameValues[key] ?? ''}
                  onChange={(e) => setNameValues((v) => ({ ...v, [key]: e.target.value }))}
                  onBlur={(e) => {
                    if (e.target.value === ((settings[key] as string) ?? '')) return;
                    autoSave(key, e.target.value);
                  }}
                  placeholder={t(`${labelKey}Placeholder`)}
                  className="sheet-input settings-row-control"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
