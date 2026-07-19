// components/items/ItemCard.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Settings } from '@/app/lib/definitions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast, type ToastType } from '@/components/ui/notification';
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';
import { DeleteXButton } from '@/components/ui/DeleteXButton';
import { RemoveXButton } from '@/components/ui/RemoveXButton';

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
}) {
  const t = useTranslations('items');
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
      const statusRes = await fetch(`/api/v1/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 2 }),
      });
      if (!statusRes.ok) {
        setNotification({ type: 'error', message: t('markSoldFailed') });
        return;
      }

      const saleRes = await fetch(`/api/v1/sales/${saleId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id }),
      });
      if (!saleRes.ok) {
        // Roll back the status change so the item isn't stuck "sold" without being on a sale.
        await fetch(`/api/v1/items/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 1 }),
        });
        setNotification({ type: 'error', message: t('markSoldFailed') });
        return;
      }

      setNotification({ type: 'success', message: t('markSoldSuccess') });
      router.refresh(); // item now fails the status=1 filter and drops off the list
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
    <div className="catalog-card interactive-card" style={{ position: 'relative' }}>
      {showDeleteButton && (
        <DeleteXButton onClick={() => setConfirmOpen(true)} label={t('delete')} />
      )}

      {removeFromPackageButton && (
        <RemoveXButton onClick={handleRemoveFromPackage} label={t('removeFromPackage')} disabled={isRemoving} loading={isRemoving} />
      )}

      {removeFromSaleButton && (
        <RemoveXButton onClick={handleRemoveFromSale} label={t('removeFromSale')} disabled={isRemovingFromSale || !saleId} loading={isRemovingFromSale} />
      )}

      <Link href={`/dashboard/items/${item.id}/edit`} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
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
              {showProfit && <span>{sellSymbol}{profit!.toFixed(2)}</span>}
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