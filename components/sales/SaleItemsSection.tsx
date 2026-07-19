// components/sales/SaleItemsSection.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/widgets/Button';
import { Badge } from '@/components/ui/Badge';
import { ItemGrid } from '@/components/items/ItemGrid';
import { AddItemsToSaleModal } from './AddItemsToSaleModal';
import type { Settings } from '@/app/lib/definitions';

export function SaleItemsSection({
    saleId,
    items,
    settings,
}: {
    saleId: number;
    items: any[];
    settings: Settings;
}) {
    const t = useTranslations('sales');
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div className="item-sheet-container" style={{ padding: 'var(--spacing-lg)', paddingTop: 0 }}>
            <div className="sheet-frame">
                <div className="sheet-body">
                    <div className="sheet-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <span className="sheet-section-title" style={{ border: 'none', margin: 0, padding: 0 }}>
                                    {t('itemsInSale', { count: items.length })}
                                </span>
                                <Badge tone="primary">{items.length}</Badge>
                            </div>
                            <Button onClick={() => setModalOpen(true)}>{t('addItems')}</Button>
                        </div>

                        <ItemGrid
                            items={items}
                            settings={settings}
                            removeFromSaleButton
                            saleId={saleId}
                            onItemRemovedFromSale={() => router.refresh()}
                        />
                    </div>
                </div>
            </div>

            {modalOpen && (
                <AddItemsToSaleModal
                    saleId={saleId}
                    onClose={() => setModalOpen(false)}
                    onAdded={() => router.refresh()}
                />
            )}
        </div>
    );
}