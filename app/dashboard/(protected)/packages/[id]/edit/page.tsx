// app/dashboard/(protected)/packages/[id]/edit/page.tsx
import { getPackageById } from '@/app/lib/services/packages';
import { getItemsByPackageId } from '@/app/lib/services/items';
import { getSettings } from '@/app/lib/services/settings';
import { getCurrencies } from '@/app/lib/services/currencies';
import { PackageForm } from '@/components/packages/PackageForm';

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [pkg, items, settings, currencies] = await Promise.all([
    getPackageById(Number(id)),
    getItemsByPackageId(Number(id)),
    getSettings(),
    getCurrencies(),
  ]);

  return (
    <PackageForm
      mode="update"
      pkg={pkg}
      packageItems={items}
      settings={settings}
      currencies={currencies}
    />
  );
}