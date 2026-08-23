// components/items/ItemCard.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { Settings } from '@/app/lib/definitions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast, type ToastType } from '@/components/ui/notification';
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';
import { DeleteXButton } from '@/components/ui/DeleteXButton';
import { RemoveXButton } from '@/components/ui/RemoveXButton';
import { getProfitColorClass } from '@/app/lib/locale/profitColor';
import { sellItemToSale } from '@/app/lib/items/sellItemClient';

type ItemWithRelations = {
  id: number;
  name: string | null;
  sell_price: number | null;
  purchase_price: number | null;
  cost_price: number | null;
  main_image_ref: { url: string } | null;
  purchase_currency: { currency_code: string; currency_symbol: string } | null;
};

export function ItemCard({
  item,
  settings,
  showDeleteButton = false,
  sellMode = false,
  saleId,
  removeFromPackageButton = false,
  onRemovedFromPackage,
  removeFromSaleButton = false,
  onRemovedFromSale,
  compact = false,
}: {
  item: ItemWithRelations;
  settings: Settings;
  showDeleteButton?: boolean;
  sellMode?: boolean;
  saleId?: number;
  removeFromPackageButton?: boolean;
  onRemovedFromPackage?: () => void;
  removeFromSaleButton?: boolean;
  onRemovedFromSale?: () => void;
  // Shorter image area, tighter padding/fonts (see .catalog-card--compact
  // in globals.css) — used by the dashboard items page's 'compact' density
  // option, a denser-than-dense mode meant for phones.
  compact?: boolean;
}) {
  const t = useTranslations('items');
  const locale = useLocale();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [isRemovingFromSale, setIsRemovingFromSale] = useState(false);
  const [notification, setNotification] = useState<{ type: ToastType; message: string } | null>(null);

  async function handleRemoveFromSale() {
    if (!saleId) return;
    setIsRemovingFromSale(true);
    try {
      await fetch(`/api/v1/sales/${saleId}/items/${item.id}`, { method: 'DELETE' });
      onRemovedFromSale?.();
    } finally {
      setIsRemovingFromSale(false);
    }
  }

  async function handleRemoveFromPackage() {
    setIsRemoving(true);
    try {
      await fetch(`/api/v1/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: null }),
      });
      onRemovedFromPackage?.();
    } finally {
      setIsRemoving(false);
    }
  }
  const sellSymbol = settings.sell_currency?.currency_symbol ?? '';
  const purchaseSymbol = item.purchase_currency?.currency_symbol ?? '';
  const profit =
    item.sell_price !== null && item.cost_price !== null ? item.sell_price - item.cost_price : null;

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await fetch(`/api/v1/items/${item.id}`, { method: 'DELETE' });
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleMarkSold() {
    if (!saleId) return;
    setIsSelling(true);
    try {
      const ok = await sellItemToSale(item.id, saleId);
      setNotification({
        type: ok ? 'success' : 'error',
        message: ok ? t('markSoldSuccess') : t('markSoldFailed'),
      });
      if (ok) router.refresh(); // item now fails the status=1 filter and drops off the list
    } catch {
      setNotification({ type: 'error', message: t('markSoldFailed') });
    } finally {
      setIsSelling(false);
    }
  }

  const showPurchase = settings.display_purchase_price && item.purchase_price !== null;
  const showSell = settings.display_sell_price && item.sell_price !== null;
  const showCost = settings.display_cost_price && item.cost_price !== null;
  const showProfit = settings.display_profit && profit !== null;
  const hasAnyPrice = showPurchase || showSell || showCost || showProfit;

  return (
    <div className={`catalog-card interactive-card${compact ? ' catalog-card--compact' : ''}`} style={{ position: 'relative' }}>
      {showDeleteButton && (
        <DeleteXButton onClick={() => setConfirmOpen(true)} label={t('delete')} />
      )}

      {removeFromPackageButton && (
        <RemoveXButton onClick={handleRemoveFromPackage} label={t('removeFromPackage')} disabled={isRemoving} loading={isRemoving} />
      )}

      {removeFromSaleButton && (
        <RemoveXButton onClick={handleRemoveFromSale} label={t('removeFromSale')} disabled={isRemovingFromSale || !saleId} loading={isRemovingFromSale} />
      )}

      <Link
        href={
          // Tells the nav which section to highlight on the edit page (see
          // NavLinks.tsx) — that page always lives under /dashboard/items,
          // but when opened from here it's really a package/sale detail
          // context, and "back" returns there, not to the items list.
          removeFromPackageButton
            ? `/dashboard/items/${item.id}/edit?section=packages`
            : removeFromSaleButton
              ? `/dashboard/items/${item.id}/edit?section=sales`
              : `/dashboard/items/${item.id}/edit`
        }
        style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}
      >
        <div className="catalog-card-art">
          {item.main_image_ref?.url ? (
            <img
              src={item.main_image_ref.url}
              alt={item.name ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <NoImagePlaceholder label={t('noImage')} />
          )}
        </div>

        <div className="catalog-card-body">
          <span className="catalog-card-name">{item.name}</span>

          {hasAnyPrice && (
            <div className="catalog-card-prices">
              {(showPurchase || showSell) && (
                <div className="catalog-card-price-row">
                  {showPurchase && <span>{purchaseSymbol}{item.purchase_price!.toFixed(2)}</span>}
                  {showSell && <span className="catalog-card-sell-price" style={{ marginLeft: 'auto' }}>{sellSymbol}{item.sell_price!.toFixed(2)}</span>}
                </div>
              )}
              {showCost && <span>{sellSymbol}{item.cost_price!.toFixed(2)}</span>}
              {showProfit && (
                <span className={`catalog-card-profit ${getProfitColorClass(profit!, locale)}`}>
                  {sellSymbol}{profit!.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {sellMode && (
        <div className="catalog-card-actions">
          <button
            type="button"
            onClick={handleMarkSold}
            disabled={isSelling || !saleId}
            style={{
              flex: 1,
              textAlign: 'center',
              background: 'var(--color-danger)',
              color: '#fff',
              fontWeight: 'var(--font-weight-bold)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              opacity: isSelling || !saleId ? 0.6 : 1,
            }}
          >
            {isSelling ? t('marking') : t('sold')}
          </button>
        </div>
      )}

      {confirmOpen && (
        <ConfirmDialog
          message={t('confirmDeleteItem')}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
          isConfirming={isDeleting}
        />
      )}

      {notification && (
        <Toast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}