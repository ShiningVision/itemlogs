// components/sales/SaleForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/widgets/Button';
import { ArrowDownTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { Sale } from '@/app/lib/definitions';
import { parseApiError } from '@/app/lib/errors/parseApiError';

export function SaleForm({
  mode,
  sale,
  revenue,
  profit,
  currencySymbol,
}: {
  mode: 'create' | 'update';
  sale?: Sale;
  // null (not just absent) means "this sale has no items yet" — the
  // summary line only renders when both are non-null.
  revenue?: number | null;
  profit?: number | null;
  currencySymbol?: string;
}) {
  const t = useTranslations('sales');
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState(sale?.name ?? '');
  const [date, setDate] = useState(sale?.date ?? today);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!date) {
      setError(t('dateRequired'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = { name: name || undefined, date };
      const url = mode === 'create' ? '/api/v1/sales' : `/api/v1/sales/${sale!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(parseApiError(json, t('saveFailed')));
        return;
      }

      if (mode === 'create') {
        router.push(`/dashboard/sales/${json.data.id}/edit`);
      } else {
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="item-sheet-container" style={{ padding: 'var(--spacing-lg)' }}>
      {mode === 'update' && (
        <button
          type="button"
          onClick={() => router.back()}
          className="interactive-card"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            marginBottom: 'var(--spacing-sm)',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
          }}
        >
          <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
          {t('back')}
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
          {mode === 'create' ? t('createSale') : t('updateSale')}
        </h1>

        {mode === 'update' && sale && (
          <a href={`/api/v1/sales/${sale.id}/export`}>
            <Button style={{ background: 'var(--color-success)' }}>
              <ArrowDownTrayIcon style={{ width: '18px', height: '18px' }} />
              {t('exportExcel')}
            </Button>
          </a>
        )}
      </div>

      <div className="sheet-frame">
        <div className="sheet-body">
          {revenue !== null && revenue !== undefined && profit !== null && profit !== undefined && (
            <div className="sale-summary-line">
              <span>
                {t('revenue')}: {currencySymbol}{revenue.toFixed(2)}
              </span>
              <span>
                {t('profit')}: {currencySymbol}{profit.toFixed(2)}
              </span>
            </div>
          )}

          <div className="sheet-field-grid">
            <div className="sheet-field">
              <span className="sheet-label">{t('name')}</span>
              <input className="sheet-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="sheet-field">
              <span className="sheet-label">{t('date')}<span className="required-mark" aria-hidden="true">*</span></span>
              <input type="date" className="sheet-input" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          {error && <div style={{ color: 'var(--color-danger)' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}