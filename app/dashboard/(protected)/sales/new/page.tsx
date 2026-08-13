// app/dashboard/(protected)/sales/new/page.tsx
import { getSettings } from '@/app/lib/services/settings';
import { redirect } from 'next/navigation';
import { SaleForm } from '@/components/sales/SaleForm';

export default async function NewSalePage() {
  const settings = await getSettings();
  if (!settings.use_sell_price) {
    redirect('/dashboard/items');
  }

  return <SaleForm mode="create" />;
}
