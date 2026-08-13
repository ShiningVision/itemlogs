// app/dashboard/(protected)/sales/[id]/edit/page.tsx
import { getSaleById } from '@/app/lib/services/sales';
import { getSaleItems } from '@/app/lib/services/sales-items';
import { getSettings } from '@/app/lib/services/settings';
import { redirect } from 'next/navigation';
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

  if (!settings.use_sell_price) {
    redirect('/dashboard/items');
  }

  const items = saleItems.map((si) => si.items);

  // Revenue is straight sum of sell_price; profit only counts items that
  // have both a sell_price and cost_price (same "both present or skip" rule
  // ItemCard uses for its own per-item profit badge), so a partially-priced
  // item doesn't silently understate the total by treating a missing cost
  // as 0.
  const revenue = items.reduce((sum, item) => sum + (item.sell_price ?? 0), 0);
  const profit = items.reduce(
    (sum, item) =>
      sum + (item.sell_price !== null && item.cost_price !== null ? item.sell_price - item.cost_price : 0),
    0
  );

  return (
    <div>
      <SaleForm mode="update" sale={sale} revenue={items.length > 0 ? revenue : null} profit={items.length > 0 ? profit : null} currencySymbol={settings.sell_currency?.currency_symbol ?? ''} />
      <SaleItemsSection saleId={sale.id} items={items} settings={settings} />
    </div>
  );
}