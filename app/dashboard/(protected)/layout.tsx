// app/dashboard/(protected)/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/navigation/AppHeader';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <AppHeader />
      <div>{children}</div>
    </div>
  );
}
