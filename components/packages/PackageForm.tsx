// components/packages/PackageForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/widgets/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddItemsToPackageModal } from './AddItemsToPackageModal';
import { ItemGrid } from '@/components/items/ItemGrid';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import type { Package, Settings } from '@/app/lib/definitions';

type Currency = { id: number; currency_code: string };

export function PackageForm({
    mode,
    pkg,
    packageItems = [],
    settings,
    currencies,
}: {
    mode: 'create' | 'update';
    pkg?: Package;
    packageItems?: any[];
    settings: Settings;
    currencies: Currency[];
}) {
    const t = useTranslations('packages');
    const router = useRouter();

    const [form, setForm] = useState({
        name: pkg?.name ?? '',
        description: pkg?.description ?? '',
        departure_date: pkg?.departure_date ?? '',
        arrival_date: pkg?.arrival_date ?? '',
        tariff: pkg?.tariff?.toString() ?? '',
        tariff_currency: pkg?.tariff_currency ?? settings.sell_price_currency,
        shipping_fee: pkg?.shipping_fee?.toString() ?? '',
        shipping_fee_currency: pkg?.shipping_fee_currency ?? settings.default_purchase_price_currency,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addItemsModalOpen, setAddItemsModalOpen] = useState(false);
    const [distributeConfirmOpen, setDistributeConfirmOpen] = useState(false);
    const [isDistributing, setIsDistributing] = useState(false);

    function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSave() {
        if (!form.name.trim()) {
            setError(t('nameRequired'));
            return;
        }

        setIsSaving(true);
        setError(null);

        const payload = {
            name: form.name,
            description: form.description || null,
            departure_date: form.departure_date || null,
            arrival_date: form.arrival_date || null,
            tariff: form.tariff ? Number(form.tariff) : null,
            tariff_currency: form.tariff_currency,
            shipping_fee: form.shipping_fee ? Number(form.shipping_fee) : null,
            shipping_fee_currency: form.shipping_fee_currency,
        };
        try {
            const url = mode === 'create' ? '/api/v1/packages' : `/api/v1/packages/${pkg!.id}`;
            const method = mode === 'create' ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await res.json();

            if (!res.ok) {
                setError(t('saveFailed'));
                return;
            }

            if (mode === 'create') {
                router.push(`/dashboard/packages/${json.data.id}/edit`);
            } else {
                router.refresh();
            }
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDistributeFees() {
        setIsDistributing(true);
        try {
            await fetch(`/api/v1/packages/${pkg!.id}/distribute-fees`, { method: 'POST' });
            setDistributeConfirmOpen(false);
            router.refresh();
        } finally {
            setIsDistributing(false);
        }
    }

    return (
        <div className="item-sheet-container" style={{ padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
                    {mode === 'create' ? t('createPackage') : t('updatePackage')}
                </h1>

                <Button disabled title={t('comingSoon')} style={{ background: 'var(--color-success)' }}>
                    <ArrowDownTrayIcon style={{ width: '18px', height: '18px' }} />
                    {t('exportExcel')}
                </Button>
            </div>

            <div className="sheet-frame">
                <div className="sheet-body">
                    <input
                        className="sheet-name-input"
                        placeholder={t('name')}
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        required
                    />

                    <div className="sheet-route">
                        <div className="sheet-field">
                            <span className="sheet-label">{t('departureDate')}</span>
                            <input type="date" className="sheet-input" value={form.departure_date} onChange={(e) => update('departure_date', e.target.value)} />
                        </div>
                        <div className="sheet-route-arrow" aria-hidden="true">&rarr;</div>
                        <div className="sheet-field">
                            <span className="sheet-label">{t('arrivalDate')}</span>
                            <input type="date" className="sheet-input" value={form.arrival_date} onChange={(e) => update('arrival_date', e.target.value)} />
                        </div>
                    </div>

                    <div className="stat-grid">
                        <div className="stat-box">
                            <span className="stat-box-label">{t('tariff')}</span>
                            <input
                                className="stat-box-input"
                                type="number"
                                step="0.01"
                                value={form.tariff}
                                onChange={(e) => update('tariff', e.target.value)}
                            />
                        </div>
                        <div className="stat-box">
                            <span className="stat-box-label">{t('tariffCurrency')}</span>
                            <select className="stat-box-select" value={form.tariff_currency} onChange={(e) => update('tariff_currency', Number(e.target.value))}>
                                {currencies.map((c) => (<option key={c.id} value={c.id}>{c.currency_code}</option>))}
                            </select>
                        </div>
                        <div className="stat-box">
                            <span className="stat-box-label">{t('shippingFee')}</span>
                            <input
                                className="stat-box-input"
                                type="number"
                                step="0.01"
                                value={form.shipping_fee}
                                onChange={(e) => update('shipping_fee', e.target.value)}
                            />
                        </div>
                        <div className="stat-box">
                            <span className="stat-box-label">{t('shippingFeeCurrency')}</span>
                            <select className="stat-box-select" value={form.shipping_fee_currency} onChange={(e) => update('shipping_fee_currency', Number(e.target.value))}>
                                {currencies.map((c) => (<option key={c.id} value={c.id}>{c.currency_code}</option>))}
                            </select>
                        </div>
                    </div>

                    <div className="sheet-section">
                        <div className="sheet-section-title">{t('description')}</div>
                        <textarea
                            className="sheet-input"
                            style={{ minHeight: '80px', resize: 'vertical' }}
                            value={form.description}
                            onChange={(e) => update('description', e.target.value)}
                        />
                    </div>

                    {error && <div style={{ color: 'var(--color-danger)' }}>{error}</div>}

                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? t('saving') : t('save')}
                        </Button>
                    </div>

                    {mode === 'create' && (
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            {t('saveFirstToAddItems')}
                        </p>
                    )}

                    {mode === 'update' && pkg && (
                        <div className="sheet-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <span className="sheet-section-title" style={{ border: 'none', margin: 0, padding: 0 }}>
                                        {t('itemsInPackage', { count: packageItems.length })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <Button onClick={() => setAddItemsModalOpen(true)}>{t('addItemsToPackage')}</Button>
                                    {settings.use_package_fee_distribution && (
                                        <Button onClick={() => setDistributeConfirmOpen(true)}>{t('distributeFees')}</Button>
                                    )}
                                </div>
                            </div>

                            {settings.use_package_fee_distribution && (
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>
                                    {t('distributeFeesWarning')}
                                </p>
                            )}

                            <ItemGrid
                                items={packageItems}
                                settings={settings}
                                removeFromPackageButton
                                onItemRemovedFromPackage={() => router.refresh()}
                            />
                        </div>
                    )}
                </div>
            </div>

            {addItemsModalOpen && pkg && (
                <AddItemsToPackageModal
                    packageId={pkg.id}
                    onClose={() => setAddItemsModalOpen(false)}
                    onAdded={() => router.refresh()}
                />
            )}

            {distributeConfirmOpen && (
                <ConfirmDialog
                    message={t('confirmDistributeFees')}
                    confirmLabel={t('distributeFees')}
                    cancelLabel={t('cancel')}
                    onConfirm={handleDistributeFees}
                    onCancel={() => setDistributeConfirmOpen(false)}
                    isConfirming={isDistributing}
                />
            )}
        </div>
    );
}