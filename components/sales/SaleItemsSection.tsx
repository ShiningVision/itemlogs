// components/sales/SaleItemsSection.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/widgets/Button';
import { ItemGrid } from '@/components/items/ItemGrid';
import type { Settings } from '@/app/lib/definitions';

// "Sell items into this sale" used to open AddItemsToSaleModal — a picker
// that only ever attached an item to the sale, with no price step. It's
// been replaced with a link to the dedicated /dashboard/sales/[id]/sell
// page (see components/sales/SellPicker.tsx + SellReviewPanel.tsx), which
// filters like the real items page and always confirms/sets a sell price
// before marking anything sold. AddItemsToSaleModal.tsx itself is now dead
// code — see its own header comment.
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

    return (
        <div className="item-sheet-container" style={{ padding: 'var(--spacing-lg)', paddingTop: 0 }}>
            <div className="sheet-frame">
                <div className="sheet-body">
                    <div className="sheet-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                            <span className="sheet-section-title" style={{ border: 'none', margin: 0, padding: 0 }}>
                                {t('itemsInSale', { count: items.length })}
                            </span>
                            <Link href={`/dashboard/sales/${saleId}/sell`}>
                                <Button style={{ background: 'var(--color-danger)' }}>{t('sellItems')}</Button>
                            </Link>
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
        </div>
    );
}