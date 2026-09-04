// components/sales/SellPicker.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ItemFiltersBar } from '@/components/items/ItemFiltersBar';
import { ItemGrid } from '@/components/items/ItemGrid';
import { BarcodeSellScanner } from '@/components/items/BarcodeSellScanner';
import { SellReviewPanel } from './SellReviewPanel';
import { Button } from '@/widgets/Button';
import type { Settings } from '@/app/lib/definitions';

export type SelectedSellItem = { id: number; name: string | null; sell_price: number | null };

type FilterOption = { id: number; name: string | null };

// Owns the whole "picking items to sell" interaction on
// /dashboard/sales/[id]/sell — the selection itself (both from clicking
// cards and from the barcode scanner) is client state here, not the URL,
// since it needs to survive filter/pagination changes within the page (a
// tenant browsing multiple pages or narrowing filters mid-pick shouldn't
// lose what they already picked). Nothing is written to the database until
// SellReviewPanel's explicit confirm step — picking is just staging.
//
// Also owns the page's header row (back link + title + scan-to-sell button)
// and the filters bar, not just the grid — the scan button needs to sit in
// the same row as the title, aligned right, which means it needs to be a
// sibling of the title rather than rendered separately by the (server)
// page component; and it needs addFromBarcode, which is this component's
// own client state. Easiest to just have this component own that whole row
// rather than lifting state up into yet another wrapper.
export function SellPicker({
  saleId,
  items,
  settings,
  currencySymbol,
  showBarcodeScanner,
  title,
  backHref,
  emptyMessage,
  filtersBar,
}: {
  saleId: number;
  items: any[];
  settings: Settings;
  currencySymbol: string;
  showBarcodeScanner: boolean;
  title: string;
  backHref: string;
  emptyMessage: string;
  filtersBar: {
    categories: FilterOption[];
    types: FilterOption[];
    locations: FilterOption[];
    categoryItemCounts: Record<number, number>;
    typeItemCounts: Record<number, number>;
    locationItemCounts: Record<number, number>;
    selectedCategoryIds: number[];
    selectedTypeIds: number[];
    selectedLocationIds: number[];
    categoryLabel: string;
    typeLabel: string;
    locationLabel: string;
    search: string;
  };
}) {
  const t = useTranslations('sales');
  const router = useRouter();
  const [selected, setSelected] = useState<Map<number, SelectedSellItem>>(new Map());
  const [reviewOpen, setReviewOpen] = useState(false);

  function toggleSelect(item: any) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, { id: item.id, name: item.name, sell_price: item.sell_price ?? null });
      }
      return next;
    });
  }

  // Returns whether it was newly added (false if already selected) — lets
  // BarcodeSellScanner show its own "already selected" vs. "added" toast.
  // Checked against the `selected` state already in scope for this render
  // rather than inside the setSelected updater, since the updater's own
  // execution timing isn't something to rely on for a return value.
  function addFromBarcode(item: SelectedSellItem): boolean {
    if (selected.has(item.id)) return false;
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(item.id, item);
      return next;
    });
    return true;
  }

  function removeFromSelection(id: number) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  function handleConfirmed() {
    setSelected(new Map());
    setReviewOpen(false);
    router.push(`/dashboard/sales/${saleId}/edit`);
  }

  return (
    <>
      <Link
        href={backHref}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}
      >
        <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
        {t('backToSale')}
      </Link>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>{title}</h1>
        {showBarcodeScanner && <BarcodeSellScanner onItemFound={addFromBarcode} />}
      </div>

      <ItemFiltersBar
        categories={filtersBar.categories}
        types={filtersBar.types}
        locations={filtersBar.locations}
        categoryItemCounts={filtersBar.categoryItemCounts}
        typeItemCounts={filtersBar.typeItemCounts}
        locationItemCounts={filtersBar.locationItemCounts}
        selectedCategoryIds={filtersBar.selectedCategoryIds}
        selectedStatuses={[1]}
        selectedTypeIds={filtersBar.selectedTypeIds}
        selectedLocationIds={filtersBar.selectedLocationIds}
        lockStatusToAvailable
        hideManageButtons
        categoryLabel={filtersBar.categoryLabel}
        typeLabel={filtersBar.typeLabel}
        locationLabel={filtersBar.locationLabel}
        search={filtersBar.search}
      />

      <div style={{ marginTop: 'var(--spacing-md)' }}>
        {items.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)' }}>{emptyMessage}</div>
        ) : (
          <ItemGrid items={items} settings={settings} selectable selectedIds={new Set(selected.keys())} onToggleSelect={toggleSelect} />
        )}
      </div>

      {selected.size > 0 && (
        <div className="sell-picker-bar">
          <span className="sell-picker-bar-count">{t('selectedCount', { count: selected.size })}</span>
          <Button onClick={() => setReviewOpen(true)}>{t('reviewAndSell')}</Button>
        </div>
      )}

      {reviewOpen && (
        <SellReviewPanel
          saleId={saleId}
          items={[...selected.values()]}
          currencySymbol={currencySymbol}
          onRemove={removeFromSelection}
          onClose={() => setReviewOpen(false)}
          onConfirmed={handleConfirmed}
        />
      )}
    </>
  );
}
