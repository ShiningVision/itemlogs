// components/settings/AccountSecurityForm.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export function AccountSecurityForm({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  const t = useTranslations('account');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t('sectionTitle')}</div>

      <div className="settings-group">
        <div className="settings-row">
          <span>{t('yourUrl')}</span>
          <span className="settings-row-control" style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
            {url}
          </span>
        </div>

        <div className="settings-row">
          <span>{t('currentEmail')}</span>
          <span className="settings-row-control" style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
            {email}
          </span>
        </div>

        <div className="settings-row">
          <span>{t('changePassword')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }} className="settings-row-control">
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                autoComplete="new-password"
                className="sheet-input"
                style={{ width: '100%', paddingRight: 'var(--spacing-xl)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                style={{
                  position: 'absolute',
                  right: 'var(--spacing-xs)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? (
                  <EyeSlashIcon style={{ width: '18px', height: '18px' }} />
                ) : (
                  <EyeIcon style={{ width: '18px', height: '18px' }} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <span />
          <span className="settings-row-control" style={{ textAlign: 'right', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            {t('comingSoon')}
          </span>
        </div>
      </div>
    </div>
  );
}
