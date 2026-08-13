// components/auth/SetupForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Toggle } from '@/components/ui/Toggle';

// These mirror the fixed IDs app/lib/placeholder-data.ts seeds languages/
// currencies with (see app/api/setup/route.ts, which validates against the
// same lists) — not fetched from the DB since the DB doesn't have any rows
// yet at this point.
const LANGUAGE_OPTIONS = [
  { id: 1, name: 'English' },
  { id: 2, name: 'German'},
  { id: 3, name: '中文'},
  { id: 4, name: 'Japanese'},
  { id: 5, name: 'Korean'},
  { id: 6, name: 'French'},
  { id: 7, name: 'Spanish'},
];

const CURRENCY_OPTIONS = [
  { id: 1, label: 'USD ($)' },
  { id: 2, label: 'EUR (€)' },
  { id: 3, label: 'CNY (¥)' },
  { id: 4, label: 'JPY (¥)' },
  { id: 5, label: 'KRW (₩)' },
  { id: 6, label: 'GBP (£)' },
  { id: 7, label: 'CAD ($)' },
  { id: 8, label: 'AUD ($)' },
  { id: 9, label: 'CHF (CHF)' },
  { id: 10, label: 'SEK (kr)' },
  { id: 11, label: 'HKD ($)' },
  { id: 12, label: 'SGD ($)' },
  { id: 13, label: 'TWD ($)' },
];

const inputStyle: React.CSSProperties = {
  padding: 'var(--spacing-sm)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontSize: 'var(--font-size-md)',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-xs)',
};

const labelTextStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 'var(--font-weight-bold)',
  color: 'var(--color-text)',
};

const hintStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-muted)',
};

export function SetupForm() {
  const t = useTranslations('setup');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState(1);
  const [needsSellPrice, setNeedsSellPrice] = useState(true);
  const [currency, setCurrency] = useState(1);
  const [needsBarcode, setNeedsBarcode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          confirmPassword,
          language,
          currency,
          needsSellPrice,
          needsBarcode,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? t('genericError'));
        setSubmitting(false);
        return;
      }

      router.push('/login');
    } catch {
      setError(t('genericError'));
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        width: '100%',
        maxWidth: '440px',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--spacing-xs)',
          color: 'var(--color-text)',
        }}
      >
        {t('title')}
      </h1>
      <p style={{ ...hintStyle, marginBottom: 'var(--spacing-lg)' }}>{t('intro')}</p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>{t('password')}</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>{t('confirmPassword')}</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
          </label>
          <p style={hintStyle}>{t('passwordHint')}</p>
        </div>

        <label style={labelStyle}>
          <span style={labelTextStyle}>{t('language')}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(Number(e.target.value))}
            style={inputStyle}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </label>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-md)',
          }}
        >
          <div>
            <div style={labelTextStyle}>{t('needsSellPrice')}</div>
            <div style={hintStyle}>{t('needsSellPriceHint')}</div>
          </div>
          <Toggle
            name="needsSellPrice"
            defaultChecked={needsSellPrice}
            onChange={(e) => setNeedsSellPrice(e.target.checked)}
            label={t('needsSellPrice')}
          />
        </div>

        <label style={labelStyle}>
          <span style={labelTextStyle}>{t('currency')}</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(Number(e.target.value))}
            style={inputStyle}
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <span style={hintStyle}>{t('currencyHint')}</span>
        </label>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-md)',
          }}
        >
          <div>
            <div style={labelTextStyle}>{t('needsBarcode')}</div>
            <div style={hintStyle}>{t('needsBarcodeHint')}</div>
          </div>
          <Toggle
            name="needsBarcode"
            defaultChecked={needsBarcode}
            onChange={(e) => setNeedsBarcode(e.target.checked)}
            label={t('needsBarcode')}
          />
        </div>

        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            fontWeight: 'var(--font-weight-bold)',
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  );
}
