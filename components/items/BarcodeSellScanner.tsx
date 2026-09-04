// components/items/BarcodeSellScanner.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { QrCodeIcon } from '@heroicons/react/24/outline';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { Toast, type ToastType } from '@/components/ui/notification';
import { Tooltip } from '@/components/ui/Tooltip';
import type { SelectedSellItem } from '@/components/sales/SellPicker';

// Scan-to-sell entry point, rendered by SellPicker on the
// /dashboard/sales/[id]/sell page. Used to instantly mark a scanned item
// sold via sellItemToSale — now it only adds the resolved item to the
// picker's selection (via onItemFound), same as clicking its card in the
// grid would. That keeps every path into a sale going through the same
// explicit price-review confirm step (see SellReviewPanel.tsx) rather than
// barcode scans being the one way to skip it.
export function BarcodeSellScanner({
  onItemFound,
}: {
  // Returns true if the item was newly added, false if it was already in
  // the selection — lets this component pick the right toast without
  // needing to inspect the picker's state itself.
  onItemFound: (item: SelectedSellItem) => boolean;
}) {
  const t = useTranslations('items');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: ToastType; message: string } | null>(null);

  async function handleScan(barcode: string) {
    setScannerOpen(false);
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/v1/items/by-barcode?code=${encodeURIComponent(barcode)}`);
      if (!res.ok) {
        setNotification({ type: 'error', message: t('scanNoMatch') });
        return;
      }
      const { data: item } = await res.json();

      const added = onItemFound({ id: item.id, name: item.name, sell_price: item.sell_price ?? null });
      // A duplicate scan of something already selected is harmless — no
      // need to interrupt with a toast for it, only confirm genuine adds.
      if (added) {
        setNotification({ type: 'success', message: t('scanAddedToSelection', { name: item.name ?? t('unnamedItem') }) });
      }
    } catch {
      setNotification({ type: 'error', message: t('scanNoMatch') });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <Tooltip text={t('scanToSell')}>
        <button
          type="button"
          className="barcode-sell-scan-btn"
          aria-label={t('scanToSell')}
          onClick={() => setScannerOpen(true)}
          disabled={isProcessing}
        >
          <QrCodeIcon style={{ width: '24px', height: '24px' }} />
          {t('scanToSell')}
        </button>
      </Tooltip>

      {scannerOpen && <BarcodeScannerModal onScan={handleScan} onClose={() => setScannerOpen(false)} />}

      {notification && (
        <Toast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}
    </>
  );
}
