// components/items/ItemForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MainImagePicker } from './MainImagePicker';
import { ImageGalleryEditor } from './ImageGalleryEditor';
import { BlueprintPickerModal } from './BlueprintPickerModal';
import { Button } from '@/widgets/Button';
import { Toggle } from '@/components/ui/Toggle';
import type { Settings } from '@/app/lib/definitions';
import { resolveLabel } from '@/app/lib/labels';

type Option = { id: number; name: string | null };
type Currency = { id: number; currency_code: string; currency_name: string };
type ImageRow = { id: number; url: string };

type ItemFormData = {
  name: string;
  description: string;
  origin: string;
  barcode: string;
  status: number;
  category: number | null;
  type: number | null;
  main_image: ImageRow | null;
  cost_price: string;
  purchase_price: string;
  purchase_price_currency: number;
  sell_price: string;
  is_featured: boolean;
};

const STATUSES = [1, 2, 3, 4];

export function ItemForm({
  mode,
  item,
  initialGalleryImages = [],
  categories,
  types,
  currencies,
  settings,
  featuredCount = 0,
  featuredCap = 5,
}: {
  mode: 'create' | 'update';
  item?: any;
  initialGalleryImages?: Array<{ image_id: number; images: ImageRow }>;
  categories: Option[];
  types: Option[];
  currencies: Currency[];
  settings: Settings;
  featuredCount?: number;
  featuredCap?: number;
}) {
  const t = useTranslations('items');
  const router = useRouter();

  const [form, setForm] = useState<ItemFormData>({
    name: item?.name ?? '',
    description: item?.description ?? '',
    origin: item?.origin ?? '',
    barcode: item?.barcode?.toString() ?? '',
    status: item?.status ?? 1,
    category: item?.category ?? null,
    type: item?.type ?? null,
    main_image: item?.main_image_ref ? { id: item.main_image, url: item.main_image_ref.url } : null,
    cost_price: item?.cost_price?.toString() ?? '',
    purchase_price: item?.purchase_price?.toString() ?? '',
    purchase_price_currency: item?.purchase_price_currency ?? settings.default_purchase_price_currency,
    sell_price: item?.sell_price?.toString() ?? '',
    is_featured: item?.is_featured ?? false,
  });

  // Sell price is always in the shop's single sell_price_currency — no
  // per-item override, so just look up its code/symbol for display.
  const shopSellCurrency = currencies.find((c) => c.id === settings.sell_price_currency);

  const [gallery, setGallery] = useState<ImageRow[]>(
    initialGalleryImages.map((gi) => gi.images)
  );
  const [stayOnPage, setStayOnPage] = useState(false);
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const categoryLabel = resolveLabel(settings.name_category, t('category'));
  const typeLabel = resolveLabel(settings.name_type, t('type'));

  function update<K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyBlueprint(bp: any) {
    setForm({
      name: bp.name ?? '',
      description: bp.description ?? '',
      origin: bp.origin ?? '',
      barcode: bp.barcode?.toString() ?? '',
      status: bp.status ?? 1,
      category: bp.category,
      type: bp.type,
      main_image: bp.main_image_ref ? { id: bp.main_image, url: bp.main_image_ref.url } : null,
      cost_price: bp.cost_price?.toString() ?? '',
      purchase_price: bp.purchase_price?.toString() ?? '',
      purchase_price_currency: bp.purchase_price_currency,
      sell_price: bp.sell_price?.toString() ?? '',
      is_featured: false,
    });
  }

  function buildPayload() {
    return {
      name: form.name,
      description: form.description || undefined,
      origin: form.origin || undefined,
      barcode: settings.use_barcode && form.barcode ? form.barcode.trim() : undefined,
      status: form.status,
      category: form.category,
      type: form.type,
      main_image: form.main_image?.id ?? null,
      cost_price: form.cost_price ? Number(form.cost_price) : 0,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : 0,
      purchase_price_currency: form.purchase_price_currency,
      sell_price: settings.use_sell_price && form.sell_price ? Number(form.sell_price) : Number(form.sell_price || 0),
      is_featured: form.is_featured,
    };
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = buildPayload();
      const url = mode === 'create' ? '/api/v1/items' : `/api/v1/items/${item.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json?.error === 'featuredCapReached' ? t('featuredCapReached', { cap: featuredCap }) : t('saveFailed'));
        return;
      }

      const savedItemId = mode === 'create' ? json.data.id : item.id;

      // Attach any gallery images picked before the item existed (create mode only)
      if (mode === 'create' && gallery.length > 0) {
        await Promise.all(
          gallery.map((img) =>
            fetch(`/api/v1/items/${savedItemId}/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_id: img.id }),
            })
          )
        );
      }
      if (!(mode === 'create' && stayOnPage)) {
        router.push('/dashboard/items');
      }
      // NOTE: The following code is for if you want to reset form after saving.
      // if (mode === 'create' && stayOnPage) {
      //   // Reset form for the next item, stay on this page
      //   setForm({
      //     name: '',
      //     description: '',
      //     origin: '',
      //     barcode: '',
      //     status: 1,
      //     category: null,
      //     type: null,
      //     main_image: null,
      //     cost_price: '',
      //     purchase_price: '',
      //     purchase_price_currency: settings.default_purchase_price_currency,
      //     sell_price: '',
      //   });
      //   setGallery([]);
      // } else {
      //   router.push('/dashboard/items');
      // }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAsBlueprint() {
    const payload = buildPayload();
    await fetch('/api/v1/blueprints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async function handleAddGalleryImage(img: ImageRow) {
    if (mode === 'update') {
      await fetch(`/api/v1/items/${item.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: img.id }),
      });
    }
    setGallery((prev) => [...prev, img]);
  }

  async function handleRemoveGalleryImage(imageId: number) {
    if (mode === 'update') {
      await fetch(`/api/v1/items/${item.id}/images/${imageId}`, { method: 'DELETE' });
    }
    setGallery((prev) => prev.filter((i) => i.id !== imageId));
  }

  return (
    <div className="item-sheet-container" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
          {mode === 'create' ? t('createItem') : t('updateItem')}
        </h1>
        {mode === 'create' && (
          <Button onClick={() => setBlueprintModalOpen(true)}>{t('createFromBlueprint')}</Button>
        )}
      </div>

      <div className="sheet-frame">
        <div className="sheet-body">
          <div className="sheet-header">
            <div className="sheet-portrait">
              <MainImagePicker value={form.main_image} onChange={(img) => update('main_image', img)} />
            </div>

            <div className="sheet-title-block">
              <input
                className="sheet-name-input"
                placeholder={t('name')}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />

              <div className="sheet-field-grid" style={{ marginTop: 'var(--spacing-sm)' }}>
                <div className="sheet-field">
                  <span className="sheet-label">{t('status')}</span>
                  <select className="sheet-input" value={form.status} onChange={(e) => update('status', Number(e.target.value))}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{t(`status${s}`)}</option>
                    ))}
                  </select>
                </div>

                <div className="sheet-field">
                  <span className="sheet-label">{categoryLabel}</span>
                  <select className="sheet-input" value={form.category ?? ''} onChange={(e) => update('category', e.target.value ? Number(e.target.value) : null)}>
                    <option value="">{t('none')}</option>
                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>

                <div className="sheet-field">
                  <span className="sheet-label">{typeLabel}</span>
                  <select className="sheet-input" value={form.type ?? ''} onChange={(e) => update('type', e.target.value ? Number(e.target.value) : null)}>
                    <option value="">{t('none')}</option>
                    {types.map((tp) => (<option key={tp.id} value={tp.id}>{tp.name}</option>))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="sheet-section">
            <div className="sheet-section-title">{t('gallery')}</div>
            <ImageGalleryEditor
              images={gallery}
              onAdd={handleAddGalleryImage}
              onRemove={handleRemoveGalleryImage}
            />
          </div>

          <div className="stat-grid">
            <div className="stat-box">
              <span className="stat-box-label">{t('purchasePrice')}</span>
              <input
                className="stat-box-input"
                type="number"
                step="0.01"
                value={form.purchase_price}
                onChange={(e) => update('purchase_price', e.target.value)}
                required
              />
            </div>

            <div className="stat-box">
              <span className="stat-box-label">{t('purchasePriceCurrency')}</span>
              <select className="stat-box-select" value={form.purchase_price_currency} onChange={(e) => update('purchase_price_currency', Number(e.target.value))}>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.currency_code}</option>
                ))}
              </select>
            </div>

            <div className="stat-box">
              <span className="stat-box-label">{t('costPrice')}</span>
              <input
                className="stat-box-input"
                type="number"
                step="0.01"
                value={form.cost_price}
                onChange={(e) => update('cost_price', e.target.value)}
              />
            </div>

            {settings.use_sell_price && (
              <div className="stat-box">
                <span className="stat-box-label">{t('sellPrice')}</span>
                <input
                  className="stat-box-input"
                  type="number"
                  step="0.01"
                  value={form.sell_price}
                  onChange={(e) => update('sell_price', e.target.value)}
                />
              </div>
            )}
            {/* Sell price currency is fixed shop-wide (Settings > Sell price currency) —
                cost_price shares it too, even if sell price is hidden. */}
            <div className="stat-box">
              <span className="stat-box-label">{t('sellPriceCurrency')}</span>
              <span className="stat-box-input" style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>
                {shopSellCurrency?.currency_code ?? ''}
              </span>
            </div>

          </div>

          <div className="sheet-section">
            <div className="sheet-section-title">{t('description')}</div>
            <textarea
              className="sheet-input"
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div className="sheet-field-grid">
            <div className="sheet-field">
              <span className="sheet-label">{t('origin')}</span>
              <input className="sheet-input" value={form.origin} onChange={(e) => update('origin', e.target.value)} />
            </div>

            {settings.use_barcode && (
              <div className="sheet-field">
                <span className="sheet-label">{t('barcode')}</span>
                <input className="sheet-input" value={form.barcode} onChange={(e) => update('barcode', e.target.value)} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div>{t('featureThisItem')}</div>
              {!form.is_featured && featuredCount >= featuredCap && (
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  {t('featuredCapReached', { cap: featuredCap })}
                </div>
              )}
            </div>
            <Toggle
              name="is_featured"
              defaultChecked={form.is_featured}
              disabled={!form.is_featured && featuredCount >= featuredCap}
              label={t('featureThisItem')}
              onChange={(e) => update('is_featured', e.target.checked)}
            />
          </div>

          {mode === 'create' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
              <input type="checkbox" checked={stayOnPage} onChange={(e) => setStayOnPage(e.target.checked)} />
              {t('stayOnPage')}
            </label>
          )}

          {errorMessage && <div style={{ color: 'var(--color-danger)' }}>{errorMessage}</div>}

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('saving') : t('save')}
            </Button>
            {mode === 'create' && (
              <Button onClick={handleSaveAsBlueprint} disabled={isSaving}>
                {t('saveAsBlueprint')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {blueprintModalOpen && (
        <BlueprintPickerModal onSelect={applyBlueprint} onClose={() => setBlueprintModalOpen(false)} />
      )}
    </div>
  );
}