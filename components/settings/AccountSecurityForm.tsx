// components/settings/AccountSecurityForm.tsx
'use client';

import { useActionState, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { updatePasswordAction } from '@/app/lib/actions/account';
import { createSharePasswordAction, deleteSharePasswordAction } from '@/app/lib/actions/share-passwords';
import type { SharePassword } from '@/app/lib/services/share-passwords';

const primaryButtonStyle: CSSProperties = {
  background: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--spacing-sm) var(--spacing-md)',
  fontWeight: 'var(--font-weight-bold)',
  cursor: 'pointer',
  alignSelf: 'flex-start',
};

const dangerButtonStyle: CSSProperties = {
  background: 'transparent',
  color: 'var(--color-danger)',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--spacing-xs) var(--spacing-sm)',
  cursor: 'pointer',
  fontSize: 'var(--font-size-sm)',
};

type ActionResult = { success: true } | { error: string } | undefined;

async function passwordFormAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return updatePasswordAction(formData);
}

async function createShareFormAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return createSharePasswordAction(formData);
}

function PasswordField({
  name,
  label,
  t,
}: {
  name: string;
  label: string;
  t: (key: string) => string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <input
          name={name}
          type={show ? 'text' : 'password'}
          autoComplete="off"
          className="sheet-input"
          style={{ width: '100%', paddingRight: 'var(--spacing-xl)' }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? t('hidePassword') : t('showPassword')}
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
          {show ? <EyeSlashIcon style={{ width: '18px', height: '18px' }} /> : <EyeIcon style={{ width: '18px', height: '18px' }} />}
        </button>
      </div>
    </label>
  );
}

export function AccountSecurityForm({
  url,
  isOwner,
  sharePasswords,
}: {
  url: string;
  isOwner: boolean;
  sharePasswords: SharePassword[];
}) {
  const t = useTranslations('account');
  const [passwordState, passwordFormActionFn, isPasswordPending] = useActionState<ActionResult, FormData>(
    passwordFormAction,
    undefined,
  );
  const [shareState, shareFormActionFn, isSharePending] = useActionState<ActionResult, FormData>(
    createShareFormAction,
    undefined,
  );

  const passwordError = passwordState && 'error' in passwordState ? passwordState.error : undefined;
  const passwordSuccess = passwordState && 'success' in passwordState;
  const shareError = shareState && 'error' in shareState ? shareState.error : undefined;
  const shareSuccess = shareState && 'success' in shareState;

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t('sectionTitle')}</div>

      <div className="settings-group">
        <div className="settings-row" style={{ borderBottom: isOwner ? undefined : 'none' }}>
          <span>{t('yourUrl')}</span>
          <span className="settings-row-control" style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
            {url || t('urlUnavailable')}
          </span>
        </div>

        {isOwner && (
          <div style={{ padding: 'var(--spacing-md)' }}>
            <form
              action={passwordFormActionFn}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}
            >
              <PasswordField name="current_password" label={t('currentPassword')} t={t} />
              <PasswordField name="new_password" label={t('newPassword')} t={t} />
              <PasswordField name="confirm_password" label={t('confirmNewPassword')} t={t} />

              <button type="submit" aria-disabled={isPasswordPending} style={primaryButtonStyle}>
                {isPasswordPending ? t('submitting') : t('changePassword')}
              </button>

              {passwordError && (
                <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>
                  {t(`errors.${passwordError}`)}
                </p>
              )}
              {passwordSuccess && (
                <p style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>
                  {t('passwordUpdated')}
                </p>
              )}
            </form>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="settings-group" style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
          <div className="settings-section-title">{t('shareSectionTitle')}</div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: '0 0 var(--spacing-md)' }}>
            {t('shareSectionHint')}
          </p>

          {sharePasswords.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {sharePasswords.map((sp) => (
                <li
                  key={sp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <div>{sp.label || t('unlabeled')}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      {new Date(sp.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <form action={deleteSharePasswordAction}>
                    <input type="hidden" name="id" value={sp.id} />
                    <button type="submit" style={dangerButtonStyle}>
                      {t('delete')}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{t('noSharePasswords')}</p>
          )}

          <form
            action={shareFormActionFn}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}
          >
            <PasswordField name="admin_password" label={t('adminPasswordToCreate')} t={t} />
            <PasswordField name="new_password" label={t('newSharePassword')} t={t} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{t('shareLabel')}</span>
              <input name="label" type="text" className="sheet-input" placeholder={t('shareLabelPlaceholder')} />
            </label>

            <button type="submit" aria-disabled={isSharePending} style={primaryButtonStyle}>
              {isSharePending ? t('submitting') : t('createSharePassword')}
            </button>

            {shareError && (
              <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>{t(`errors.${shareError}`)}</p>
            )}
            {shareSuccess && (
              <p style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>{t('sharePasswordCreated')}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
