// components/items/BarcodeSellScanner.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { QrCodeIcon } from '@heroicons/react/24/outline';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { Toast, type ToastType } from '@/components/ui/notification';
import { sellItemToSale } from '@/app/lib/items/sellItemClient';
import { Tooltip } from '@/components/ui/Tooltip';

// Scan-to-sell entry point rendered in the items page's button row while
// sell mode is active (see app/dashboard/(protected)/items/page.tsx). A
// scanned barcode is resolved to an available item via the by-barcode API,
// then sold through the same sellItemToSale helper the per-item Sell
// button uses.
export function BarcodeSellScanner({ saleId }: { saleId?: number }) {
  const t = useTranslations('items');
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: ToastType; message: string } | null>(null);

  async function handleScan(barcode: string) {
    setScannerOpen(false);
    if (!saleId) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/v1/items/by-barcode?code=${encodeURIComponent(barcode)}`);
      if (!res.ok) {
        setNotification({ type: 'error', message: t('scanNoMatch') });
        return;
      }
      const { data: item } = await res.json();

      const ok = await sellItemToSale(item.id, saleId);
      setNotification({
        type: ok ? 'success' : 'error',
        message: ok ? t('markSoldSuccess') : t('markSoldFailed'),
      });
      if (ok) router.refresh();
    } catch {
      setNotification({ type: 'error', message: t('markSoldFailed') });
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
          disabled={!saleId || isProcessing}
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
