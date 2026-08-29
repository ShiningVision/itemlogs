// components/items/ItemForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, QrCodeIcon, InformationCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { MainImagePicker } from './MainImagePicker';
import { ImageGalleryEditor } from './ImageGalleryEditor';
import { BlueprintPickerModal } from './BlueprintPickerModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { TagManagerModal, type Tag } from '@/components/reference-data/TagManagerModal';
import { Button } from '@/widgets/Button';
import { Toggle } from '@/components/ui/Toggle';
import { CharCountTextarea } from '@/components/ui/CharCountTextarea';
import { Toast, type ToastType } from '@/components/ui/notification';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Settings } from '@/app/lib/definitions';
import { resolveLabel } from '@/app/lib/labels';
import { parseApiError } from '@/app/lib/errors/parseApiError';

type Option = { id: number; name: string | null };
type Currency = { id: number; currency_code: string; currency_name: string };
type ImageRow = { id: number; url: string };

type ItemFormData = {
  name: string;
  description: string;
  // Location is now a lookup-table assignment (like category/type), reached
  // via TagManagerModal instead of typed freehand — null means "no
  // location" (see the comment above the `locations` seed array in
  // placeholder-data.ts).
  location: Tag | null;
  barcode: string;
  status: number;
  // Many-to-many now (item_categories/item_types join tables) — held here
  // as arrays of {id, name} tags, same shape as `location`, so the chip UI
  // below can render names without a separate lookup. Empty array means
  // "no categories"/"no types" (displayed as "Other").
  categories: Tag[];
  types: Tag[];
  main_image: ImageRow | null;
  cost_price: string;
  purchase_price: string;
  purchase_price_currency: number;
  sell_price: string;
  // Private, owner-only — only rendered/sent when settings.use_secret_notes
  // is on. Never present on blueprints (see applyBlueprint below).
  notes: string;
};

const STATUSES = [1, 2, 3, 4];

// Matches the `description VARCHAR(255)` column (see app/api/setup/
// route.ts) — capped client-side so a paste-heavy description gets an
// immediate character count instead of failing at save time. `notes` has no
// equivalent cap: it's a TEXT column with no length limit (see the same
// setup route), so its counter (below) shows a running count with no max.
const DESCRIPTION_MAX_LENGTH = 255;

export function ItemForm({
  mode,
  item,
  initialGalleryImages = [],
  categories,
  types,
  locations,
  locationItemCounts,
  currencies,
  settings,
}: {
  mode: 'create' | 'update';
  item?: any;
  initialGalleryImages?: Array<{ image_id: number; images: ImageRow }>;
  categories: Option[];
  types: Option[];
  locations: Option[];
  locationItemCounts: Record<number, number>;
  currencies: Currency[];
  settings: Settings;
}) {
  const t = useTranslations('items');
  const router = useRouter();

  const [form, setForm] = useState<ItemFormData>({
    name: item?.name ?? '',
    description: item?.description ?? '',
    location: item?.location_ref ? { id: item.location_id, name: item.location_ref.name } : null,
    barcode: item?.barcode?.toString() ?? '',
    status: item?.status ?? 1,
    categories: item?.categories ?? [],
    types: item?.types ?? [],
    main_image: item?.main_image_ref ? { id: item.main_image, url: item.main_image_ref.url } : null,
    cost_price: item?.cost_price?.toString() ?? '',
    purchase_price: item?.purchase_price?.toString() ?? '',
    purchase_price_currency: item?.purchase_price_currency ?? settings.default_purchase_price_currency,
    sell_price: item?.sell_price?.toString() ?? '',
    notes: item?.notes ?? '',
  });

  // Sell price is always in the shop's single sell_price_currency — no
  // per-item override, so just look up its code/symbol for display.
  const shopSellCurrency = currencies.find((c) => c.id === settings.sell_price_currency);

  const [gallery, setGallery] = useState<ImageRow[]>(
    initialGalleryImages.map((gi) => gi.images)
  );
  const [stayOnPage, setStayOnPage] = useState(false);
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingBlueprint, setIsSavingBlueprint] = useState(false);
  const [blueprintNotification, setBlueprintNotification] = useState<{ type: ToastType; message: string } | null>(null);
  const categoryLabel = resolveLabel(settings.name_category, t('category'));
  const typeLabel = resolveLabel(settings.name_type, t('type'));

  function update<K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyBlueprint(bp: any) {
    setForm({
      name: bp.name ?? '',
      description: bp.description ?? '',
      // Blueprints only carry a raw location_id (their service doesn't join
      // location_ref — see app/lib/services/blueprints.ts) — resolve the
      // name from this form's own `locations` prop instead.
      location: bp.location_id != null ? locations.find((l) => l.id === bp.location_id) ?? null : null,
      barcode: bp.barcode?.toString() ?? '',
      status: bp.status ?? 1,
      categories: bp.categories ?? [],
      types: bp.types ?? [],
      main_image: bp.main_image_ref ? { id: bp.main_image, url: bp.main_image_ref.url } : null,
      cost_price: bp.cost_price?.toString() ?? '',
      purchase_price: bp.purchase_price?.toString() ?? '',
      purchase_price_currency: bp.purchase_price_currency,
      sell_price: bp.sell_price?.toString() ?? '',
      // Blueprints have no notes field (see app/api/setup/route.ts's items
      // table comment) — nothing to carry over.
      notes: '',
    });
  }

  function buildPayload() {
    return {
      name: form.name,
      description: form.description || undefined,
      location_id: form.location?.id ?? null,
      barcode: settings.use_barcode && form.barcode ? form.barcode.trim() : undefined,
      status: form.status,
      category_ids: form.categories.map((c) => c.id),
      type_ids: form.types.map((tp) => tp.id),
      main_image: form.main_image?.id ?? null,
      cost_price: form.cost_price ? Number(form.cost_price) : 0,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : 0,
      purchase_price_currency: form.purchase_price_currency,
      sell_price: settings.use_sell_price && form.sell_price ? Number(form.sell_price) : Number(form.sell_price || 0),
      notes: settings.use_secret_notes ? form.notes || undefined : undefined,
    };
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setErrorMessage(t('nameRequired'));
      return;
    }

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
        setErrorMessage(parseApiError(json, t('saveFailed')));
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
      if (mode === 'update') {
        // Go back to wherever this edit was opened from (items list,
        // package view, sale view, ...) instead of always the items list —
        // router.back() also restores that page's scroll position, so the
        // user doesn't have to scroll back down to where they were.
        router.back();
        router.refresh();
      } else if (!(mode === 'create' && stayOnPage)) {
        router.push('/dashboard/items');
      }
      // NOTE: The following code is for if you want to reset form after saving.
      // if (mode === 'create' && stayOnPage) {
      //   // Reset form for the next item, stay on this page
      //   setForm({
      //     name: '',
      //     description: '',
      //     location: '',
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
    if (!form.name.trim()) {
      setErrorMessage(t('nameRequired'));
      return;
    }

    setErrorMessage(null);
    setIsSavingBlueprint(true);
    try {
      const payload = buildPayload();
      const res = await fetch('/api/v1/blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setBlueprintNotification({
          type: 'error',
          message: json?.error === 'duplicateBarcode' ? t('duplicateBarcode') : parseApiError(json, t('saveFailed')),
        });
        return;
      }

      setBlueprintNotification({ type: 'success', message: t('blueprintSaved') });
    } catch {
      setBlueprintNotification({ type: 'error', message: t('saveFailed') });
    } finally {
      setIsSavingBlueprint(false);
    }
  }

  async function handleAddGalleryImage(img: ImageRow) {
    // The picker doesn't know what's already in this item's gallery, so a
    // user can select the same image twice — guard here instead, or the
    // gallery ends up with two entries sharing the same id (React key clash).
    if (gallery.some((g) => g.id === img.id)) return;

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
          <Button onClick={() => setBlueprintModalOpen(true)} title={t('createFromBlueprintHint')}>
            {t('createFromBlueprint')}
          </Button>
        )}
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
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
            {t('back')}
          </button>
        )}
      </div>

      <div className="sheet-frame">
        <div className="sheet-body">
          <div className="sheet-header">
            <div className="sheet-portrait">
              <MainImagePicker
                value={form.main_image}
                onChange={(img) => update('main_image', img)}
                excludeIds={gallery.map((g) => g.id)}
              />
            </div>

            <div className="sheet-title-block">
              <div className="sheet-name-input-wrap">
                <input
                  className="sheet-name-input"
                  placeholder={t('name')}
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                />
                <span className="required-mark" aria-hidden="true">*</span>
              </div>

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
                  <button
                    type="button"
                    className="sheet-input"
                    onClick={() => setCategoryModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-xs)', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ color: form.categories.length ? 'inherit' : 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.categories.length
                        ? form.categories.length > 2
                          ? t('chipSummary', { first: form.categories.slice(0, 2).map((c) => c.name).join(', '), count: form.categories.length - 2 })
                          : form.categories.map((c) => c.name).join(', ')
                        : t('other')}
                    </span>
                  </button>
                </div>

                <div className="sheet-field">
                  <span className="sheet-label">{typeLabel}</span>
                  <button
                    type="button"
                    className="sheet-input"
                    onClick={() => setTypeModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-xs)', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ color: form.types.length ? 'inherit' : 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.types.length
                        ? form.types.length > 2
                          ? t('chipSummary', { first: form.types.slice(0, 2).map((tp) => tp.name).join(', '), count: form.types.length - 2 })
                          : form.types.map((tp) => tp.name).join(', ')
                        : t('other')}
                    </span>
                  </button>
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
              additionalExcludeIds={form.main_image ? [form.main_image.id] : []}
            />
          </div>

          <div className="stat-grid">
            {/* Purchase price currency is per-item, so it stays an editable
                select — in its own small box, stacked directly above the
                purchase price box (not merged into it, not side-by-side). */}
            <div className="stat-box-group">
              <div className="stat-box stat-box-currency-box">
                <select
                  className="stat-box-currency-select"
                  value={form.purchase_price_currency}
                  onChange={(e) => update('purchase_price_currency', Number(e.target.value))}
                >
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>{c.currency_code}</option>
                  ))}
                </select>
              </div>
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
            </div>

            {/* Cost/sell price currency is fixed shop-wide (Settings > Sell
                price currency), so each gets its own static small box above it. */}
            <div className="stat-box-group">
              <div className="stat-box stat-box-currency-box">
                <span className="stat-box-currency">{shopSellCurrency?.currency_code ?? ''}</span>
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
            </div>

            {settings.use_sell_price && (
              <div className="stat-box-group">
                <div className="stat-box stat-box-currency-box">
                  <span className="stat-box-currency">{shopSellCurrency?.currency_code ?? ''}</span>
                </div>
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
              </div>
            )}
          </div>

          <div className="sheet-section">
            <div className="sheet-section-title">{t('description')}</div>
            <CharCountTextarea
              className="sheet-input"
              minHeight="100px"
              maxLength={DESCRIPTION_MAX_LENGTH}
              value={form.description}
              onChange={(value) => update('description', value)}
            />
          </div>

          {settings.use_secret_notes && (
            <div className="sheet-section">
              <div className="sheet-section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                {t('notes')}
                <Tooltip text={t('notesHint')}>
                  <InformationCircleIcon style={{ width: '16px', height: '16px', opacity: 0.6 }} />
                </Tooltip>
              </div>
              <CharCountTextarea
                className="sheet-input"
                minHeight="80px"
                value={form.notes}
                onChange={(value) => update('notes', value)}
              />
            </div>
          )}

          <div className="sheet-field-grid">
            <div className="sheet-field">
              <span className="sheet-label">{t('location')}</span>
              <Tooltip text={t('location')}>
                <button
                  type="button"
                  className="sheet-input"
                  onClick={() => setLocationModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--spacing-xs)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ color: form.location ? 'inherit' : 'var(--color-text-muted)' }}>
                    {form.location?.name ?? t('noLocation')}
                  </span>
                  <MapPinIcon style={{ width: '16px', height: '16px', flexShrink: 0, opacity: 0.6 }} />
                </button>
              </Tooltip>
            </div>

            {settings.use_barcode && (
              <div className="sheet-field">
                <span className="sheet-label">{t('barcode')}</span>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                  <input
                    className="sheet-input"
                    style={{ flex: 1 }}
                    value={form.barcode}
                    onChange={(e) => update('barcode', e.target.value)}
                  />
                  <Tooltip text={t('scanBarcode')}>
                    <button
                      type="button"
                      className="barcode-scan-icon-btn"
                      aria-label={t('scanBarcode')}
                      onClick={() => setScannerOpen(true)}
                    >
                      <QrCodeIcon style={{ width: '20px', height: '20px' }} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>

          {mode === 'create' && (
            <Tooltip text={t('stayOnPageHint')}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)', alignSelf: 'flex-start' }}>
                <input type="checkbox" checked={stayOnPage} onChange={(e) => setStayOnPage(e.target.checked)} />
                {t('stayOnPage')}
              </label>
            </Tooltip>
          )}

          {errorMessage && <div style={{ color: 'var(--color-danger)' }}>{errorMessage}</div>}

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('saving') : t('save')}
            </Button>
            {mode === 'create' && (
              <Button onClick={handleSaveAsBlueprint} disabled={isSavingBlueprint} title={t('saveAsBlueprintHint')}>
                {isSavingBlueprint ? t('saving') : t('saveAsBlueprint')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {blueprintModalOpen && (
        <BlueprintPickerModal onSelect={applyBlueprint} onClose={() => setBlueprintModalOpen(false)} />
      )}

      {locationModalOpen && (
        <TagManagerModal
          mode="assign"
          apiPath="/api/v1/locations"
          label={t('location')}
          items={locations}
          itemCounts={locationItemCounts}
          selectedIds={form.location ? [form.location.id] : []}
          onAssign={(tags) => update('location', tags[0] ?? null)}
          onClose={() => setLocationModalOpen(false)}
        />
      )}

      {categoryModalOpen && (
        <TagManagerModal
          mode="assign"
          multi
          apiPath="/api/v1/categories"
          label={categoryLabel}
          items={categories}
          itemCounts={{}}
          selectedIds={form.categories.map((c) => c.id)}
          onAssign={(tags) => update('categories', tags)}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}

      {typeModalOpen && (
        <TagManagerModal
          mode="assign"
          multi
          apiPath="/api/v1/types"
          label={typeLabel}
          items={types}
          itemCounts={{}}
          selectedIds={form.types.map((tp) => tp.id)}
          onAssign={(tags) => update('types', tags)}
          onClose={() => setTypeModalOpen(false)}
        />
      )}

      {blueprintNotification && (
        <Toast
          type={blueprintNotification.type}
          message={blueprintNotification.message}
          onClose={() => setBlueprintNotification(null)}
        />
      )}

      {scannerOpen && (
        <BarcodeScannerModal
          onScan={(text) => {
            update('barcode', text);
            setScannerOpen(false);

            // Create mode only: if a blueprint was saved under this exact
            // barcode, apply it immediately — no confirmation step, per
            // explicit product decision (asking first was judged too slow).
            if (mode === 'create') {
              fetch(`/api/v1/blueprints/by-barcode?code=${encodeURIComponent(text)}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((json) => {
                  if (json?.data) {
                    applyBlueprint(json.data);
                    setBlueprintNotification({ type: 'success', message: t('blueprintAppliedFromScan') });
                  }
                })
                .catch(() => {
                  // Silent — a failed lookup shouldn't block the scan itself.
                });
            }
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}