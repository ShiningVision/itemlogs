// components/items/BarcodeScannerModal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Shared camera-based scanner overlay, built on html5-qrcode. Used both by
// ItemForm (scan a barcode straight into the Barcode field) and by the
// items page's scan-to-sell button — same camera plumbing, different
// onScan handler. All gated behind settings.use_barcode by every caller.
//
// html5-qrcode is dynamically imported rather than imported at the top of
// this file: it touches browser-only APIs (camera, DOM) at construction
// time, and this component only ever renders client-side anyway, but a
// dynamic import also keeps the (fairly large) library out of the main
// bundle for tenants who never open a scanner.
export function BarcodeScannerModal({
  onScan,
  onClose,
}: {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations('items');
  const regionId = 'barcode-scanner-region';
  const scannerRef = useRef<any>(null);
  const scannedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            // The success callback keeps firing on every frame the scanner
            // still finds the same code in — only act on the first one.
            if (scannedRef.current) return;
            scannedRef.current = true;
            onScan(decodedText);
          },
          () => {
            // Per-frame "no code found in this frame" callback — expected
            // continuously while the camera is pointed at nothing readable,
            // not an actual error.
          }
        )
        .catch(() => {
          if (!cancelled) setError(t('scanCameraError'));
        });
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            // Already stopped/never started (e.g. permission was denied
            // before start() resolved) — nothing left to clean up.
          });
      }
    };
    // Mount-once: the scanner owns its own lifecycle via start()/stop().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="barcode-scanner-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="barcode-scanner-panel" onClick={(e) => e.stopPropagation()}>
        <div className="barcode-scanner-header">
          <span>{t('scanModalTitle')}</span>
          <button type="button" className="barcode-scanner-close" aria-label={t('cancel')} onClick={onClose}>
            <XMarkIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {error ? (
          <div className="barcode-scanner-error">{error}</div>
        ) : (
          <div id={regionId} className="barcode-scanner-viewport" />
        )}
      </div>
    </div>
  );
}
