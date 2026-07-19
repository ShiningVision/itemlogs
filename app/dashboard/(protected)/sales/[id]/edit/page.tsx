// app/dashboard/(protected)/sales/[id]/edit/page.tsx
import { getSaleById } from '@/app/lib/services/sales';
import { getSaleItems } from '@/app/lib/services/sales-items';
import { getSettings } from '@/app/lib/services/settings';
import { SaleForm } from '@/components/sales/SaleForm';
import { SaleItemsSection } from '@/components/sales/SaleItemsSection';

export default async function EditSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sale, saleItems, settings] = await Promise.all([
    getSaleById(Number(id)),
    getSaleItems(Number(id)),
    getSettings(),
  ]);

  return (
    <div>
      <SaleForm mode="update" sale={sale} />
      <SaleItemsSection saleId={sale.id} items={saleItems.map((si) => si.items)} settings={settings} />
    </div>
  );
}