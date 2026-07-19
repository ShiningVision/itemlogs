// app/login/page.tsx
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background)',
        padding: 'var(--spacing-md)',
      }}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}