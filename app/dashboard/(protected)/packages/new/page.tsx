// app/dashboard/(protected)/packages/new/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { getCurrencies } from '@/app/lib/services/currencies';
import { PackageForm } from '@/components/packages/PackageForm';

export default async function NewPackagePage() {
  const [settings, currencies] = await Promise.all([getSettings(), getCurrencies()]);

  return <PackageForm mode="create" settings={settings} currencies={currencies} />;
}