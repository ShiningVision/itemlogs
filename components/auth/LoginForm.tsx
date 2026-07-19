// components/auth/LoginForm.tsx
'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { authenticate } from '@/app/lib/actions/auth';

export function LoginForm() {
  const t = useTranslations('login');
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        width: '100%',
        maxWidth: '360px',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--spacing-lg)',
          color: 'var(--color-text)',
        }}
      >
        {t('title')}
      </h1>

      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{t('email')}</span>
          <input
            id="email"
            name="email"
            type="email"
            required
            style={{
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-background)',
              color: 'var(--color-text)',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{t('password')}</span>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            style={{
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-background)',
              color: 'var(--color-text)',
            }}
          />
        </label>

        <button
          type="submit"
          aria-disabled={isPending}
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            fontWeight: 'var(--font-weight-bold)',
            cursor: 'pointer',
          }}
        >
          {isPending ? t('submitting') : t('submit')}
        </button>

        <div style={{ minHeight: '20px' }} aria-live="polite" aria-atomic="true">
          {errorMessage && (
            <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>{errorMessage}</p>
          )}
        </div>
      </form>

      <div style={{ position: 'relative', textAlign: 'center', margin: 'var(--spacing-md) 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
        <span style={{ background: 'var(--color-surface)', padding: '0 var(--spacing-sm)' }}>{t('or')}</span>
        <div style={{ position: 'absolute', left: 0, top: '50%', zIndex: -1, height: '1px', width: '100%', background: 'var(--color-border)' }} />
      </div>

      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        style={{
          width: '100%',
          background: 'var(--color-background)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          cursor: 'pointer',
        }}
      >
        {t('continueWithGoogle')}
      </button>
    </div>
  );
}