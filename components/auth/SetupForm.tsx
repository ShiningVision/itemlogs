// components/auth/SetupForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import enMessages from '@/messages/en.json';

// These mirror the fixed IDs app/lib/placeholder-data.ts seeds languages/
// currencies with (see app/api/setup/route.ts, which validates against the
// same lists) — not fetched from the DB since the DB doesn't have any rows
// yet at this point. Names are shown in their own native language so a
// visitor can recognize their language before anything switches.
const LANGUAGE_OPTIONS = [
  { id: 1, name: 'English', code: 'en' },
  { id: 2, name: 'Deutsch', code: 'de' },
  { id: 3, name: '中文', code: 'zh' },
  { id: 4, name: '日本語', code: 'ja' },
  { id: 5, name: '한국어', code: 'ko' },
  { id: 6, name: 'Français', code: 'fr' },
  { id: 7, name: 'Español', code: 'es' },
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

type SetupMessages = {
  stepOf: string;
  back: string;
  yes: string;
  no: string;
  languageCardTitle: string;
  languageCardHint: string;
  passwordCardTitle: string;
  passwordCardHint: string;
  password: string;
  confirmPassword: string;
  passwordMismatch: string;
  passwordTooShort: string;
  continueButton: string;
  barcodeCardTitle: string;
  barcodeCardHint: string;
  sellPriceCardTitle: string;
  sellPriceCardHint: string;
  packageFeesCardTitle: string;
  packageFeesCardHint: string;
  currencyCardTitle: string;
  currencyCardHint: string;
  currency: string;
  submit: string;
  submitting: string;
  genericError: string;
};

// The server only knows how to resolve a locale from `settings.language`
// (see i18n/request.ts) — and there's no settings row yet during /setup, so
// the page is always server-rendered in English. Card 0 below lets the
// visitor pick their language anyway, and from that point on this component
// loads that locale's `setup` messages itself, independent of next-intl.
const DEFAULT_MESSAGES = enMessages.setup as SetupMessages;
const messageCache = new Map<string, SetupMessages>([['en', DEFAULT_MESSAGES]]);

async function loadSetupMessages(code: string): Promise<SetupMessages> {
  const cached = messageCache.get(code);
  if (cached) return cached;
  const mod = await import(`../../messages/${code}.json`);
  const msgs = mod.default.setup as SetupMessages;
  messageCache.set(code, msgs);
  return msgs;
}

const TOTAL_STEPS = 6;

function format(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export function SetupForm() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<SetupMessages>(DEFAULT_MESSAGES);
  const [languageId, setLanguageId] = useState(1);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [needsBarcode, setNeedsBarcode] = useState<boolean | null>(null);
  const [needsSellPrice, setNeedsSellPrice] = useState<boolean | null>(null);
  const [needsPackageFees, setNeedsPackageFees] = useState<boolean | null>(null);
  const [currency, setCurrency] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSelectLanguage(opt: (typeof LANGUAGE_OPTIONS)[number]) {
    setLanguageId(opt.id);
    if (opt.code !== 'en') {
      try {
        const msgs = await loadSetupMessages(opt.code);
        setMessages(msgs);
      } catch {
        setMessages(DEFAULT_MESSAGES);
      }
    } else {
      setMessages(DEFAULT_MESSAGES);
    }
    setStep(1);
  }

  function handlePasswordContinue() {
    if (password.length < 1) {
      setPasswordError(messages.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError(messages.passwordMismatch);
      return;
    }
    setPasswordError(null);
    setStep(2);
  }

  async function handleComplete(finalNeedsPackageFees: boolean) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          confirmPassword,
          language: languageId,
          currency,
          needsSellPrice: !!needsSellPrice,
          needsBarcode: !!needsBarcode,
          needsPackageFees: finalNeedsPackageFees,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setSubmitError(data.error ?? messages.genericError);
        setSubmitting(false);
        return;
      }

      router.push('/login');
    } catch {
      setSubmitError(messages.genericError);
      setSubmitting(false);
    }
  }

  function handlePackageFeesAnswer(value: boolean) {
    setNeedsPackageFees(value);
    setStep(5);
  }

  const showBack = step > 0 && step < TOTAL_STEPS - 1 && !submitting;

  return (
    <div className="setup-wizard">
      <div className="setup-wizard-progress">
        <div className="setup-wizard-progress-text">
          {format(messages.stepOf, { current: step + 1, total: TOTAL_STEPS })}
        </div>
        <div className="setup-wizard-progress-track">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={
                'setup-wizard-progress-dot' + (i <= step ? ' setup-wizard-progress-dot-filled' : '')
              }
            />
          ))}
        </div>
      </div>

      <div className="setup-wizard-card">
        {showBack && (
          <button
            type="button"
            className="setup-wizard-back"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            ← {messages.back}
          </button>
        )}

        {step === 0 && (
          <>
            <h1 className="setup-wizard-title">{messages.languageCardTitle}</h1>
            <p className="setup-wizard-hint">{messages.languageCardHint}</p>
            <div className="setup-wizard-language-grid">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={
                    'setup-wizard-language-option' +
                    (opt.id === languageId ? ' setup-wizard-language-option-active' : '')
                  }
                  onClick={() => handleSelectLanguage(opt)}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="setup-wizard-title">{messages.passwordCardTitle}</h1>
            <p className="setup-wizard-hint">{messages.passwordCardHint}</p>
            <div className="setup-wizard-field-group">
              <label className="setup-wizard-label">
                <span>{messages.password}</span>
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="setup-wizard-input"
                />
              </label>
              <label className="setup-wizard-label">
                <span>{messages.confirmPassword}</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePasswordContinue();
                  }}
                  className="setup-wizard-input"
                />
              </label>
            </div>
            {passwordError && <p className="setup-wizard-error">{passwordError}</p>}
            <button type="button" className="setup-wizard-continue" onClick={handlePasswordContinue}>
              {messages.continueButton}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="setup-wizard-title">{messages.barcodeCardTitle}</h1>
            <p className="setup-wizard-hint">{messages.barcodeCardHint}</p>
            <div className="setup-wizard-yesno">
              <button
                type="button"
                className="setup-wizard-yes"
                onClick={() => {
                  setNeedsBarcode(true);
                  setStep(3);
                }}
              >
                {messages.yes}
              </button>
              <button
                type="button"
                className="setup-wizard-no"
                onClick={() => {
                  setNeedsBarcode(false);
                  setStep(3);
                }}
              >
                {messages.no}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="setup-wizard-title">{messages.sellPriceCardTitle}</h1>
            <p className="setup-wizard-hint">{messages.sellPriceCardHint}</p>
            <div className="setup-wizard-yesno">
              <button
                type="button"
                className="setup-wizard-yes"
                onClick={() => {
                  setNeedsSellPrice(true);
                  setStep(4);
                }}
              >
                {messages.yes}
              </button>
              <button
                type="button"
                className="setup-wizard-no"
                onClick={() => {
                  setNeedsSellPrice(false);
                  setStep(4);
                }}
              >
                {messages.no}
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="setup-wizard-title">{messages.packageFeesCardTitle}</h1>
            <p className="setup-wizard-hint">{messages.packageFeesCardHint}</p>
            <div className="setup-wizard-yesno">
              <button
                type="button"
                className="setup-wizard-yes"
                onClick={() => handlePackageFeesAnswer(true)}
              >
                {messages.yes}
              </button>
              <button
                type="button"
                className="setup-wizard-no"
                onClick={() => handlePackageFeesAnswer(false)}
              >
                {messages.no}
              </button>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="setup-wizard-title">{messages.currencyCardTitle}</h1>
            <p className="setup-wizard-hint">{messages.currencyCardHint}</p>
            <label className="setup-wizard-label">
              <span>{messages.currency}</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(Number(e.target.value))}
                className="setup-wizard-input"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            {submitError && <p className="setup-wizard-error">{submitError}</p>}
            <button
              type="button"
              className="setup-wizard-continue"
              disabled={submitting}
              onClick={() => handleComplete(!!needsPackageFees)}
            >
              {submitting ? messages.submitting : messages.submit}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
