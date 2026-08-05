// components/settings/ThemesGrid.tsx
'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { selectThemeAction, tryThemeAction } from '@/app/lib/actions/themes';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

type ThemeState = {
  name: string;
  labelKey: string;
  priceCents: number;
  owned: boolean;
  tried: boolean;
  current: boolean;
  buyUrl: string | null;
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return '0 min';
  const minutes = Math.ceil(ms / 60000);
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

export function ThemesGrid({
  themes,
  trialActiveTheme,
  trialExpiresAt,
}: {
  themes: ThemeState[];
  trialActiveTheme: string | null;
  trialExpiresAt: string | null;
}) {
  const t = useTranslations('themes');
  const [isPending, startTransition] = useTransition();
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);

  function handleSelect(themeName: string) {
    setPendingTheme(themeName);
    startTransition(async () => {
      await selectThemeAction(themeName);
      window.location.reload();
    });
  }

  function handleTry(themeName: string) {
    setPendingTheme(themeName);
    startTransition(async () => {
      await tryThemeAction(themeName);
      window.location.reload();
    });
  }

  return (
    <div>
      {trialActiveTheme && trialExpiresAt && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('trialActive', { theme: t(themes.find((th) => th.name === trialActiveTheme)?.labelKey ?? trialActiveTheme), time: formatRemaining(trialExpiresAt) })}
        </div>
      )}

      <div className="theme-grid">
        {themes.map((theme) => {
          const busy = isPending && pendingTheme === theme.name;
          const showBuyState = !theme.owned && theme.tried;
          const showTryState = !theme.owned && !theme.tried;
          const free = theme.priceCents === 0;

          return (
            <div
              key={theme.name}
              className={`theme-card${showBuyState ? ' theme-card-dimmed' : ''}`}
            >
              <div className="theme-card-image-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/themes/${theme.name}.svg`} alt={t(theme.labelKey)} className="theme-card-image" />

                {theme.current && (
                  <div className="theme-card-badge">
                    <CheckCircleIcon style={{ width: '14px', height: '14px' }} />
                    {t('current')}
                  </div>
                )}

                <div className="theme-card-overlay">
                  {theme.owned && !theme.current && (
                    <button
                      type="button"
                      className="theme-card-overlay-button"
                      disabled={busy}
                      onClick={() => handleSelect(theme.name)}
                    >
                      {t('switchTo')}
                    </button>
                  )}
                  {showTryState && (
                    <button
                      type="button"
                      className="theme-card-overlay-button"
                      disabled={busy}
                      onClick={() => handleTry(theme.name)}
                    >
                      {t('tryItOut')}
                    </button>
                  )}
                  {showBuyState && theme.buyUrl && (
                    <a href={theme.buyUrl} className="theme-card-overlay-button">
                      {t('buyNow')}
                    </a>
                  )}
                </div>
              </div>

              <div className="theme-card-label-row">
                <span className="theme-card-label">{t(theme.labelKey)}</span>
                <span className="theme-card-price">
                  {free ? t('free') : theme.owned ? t('acquired') : formatPrice(theme.priceCents)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
