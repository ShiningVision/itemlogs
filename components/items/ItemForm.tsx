// components/items/ItemForm.tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, QrCodeIcon, InformationCircleIcon, MapPinIcon, DocumentDuplicateIcon, BookmarkSquareIcon } from '@heroicons/react/24/outline';
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
import { useUnsavedChangesGuard } from '@/app/lib/hooks/useUnsavedChangesGuard';
import { typesEnabled } from '@/app/lib/typesEnabled';

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

const STATUSES = [1, 2, 3, 4, 5];

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

  // Gallery add/remove commit immediately via their own API calls in update
  // mode (see handleAddGalleryImage/handleRemoveGalleryImage below), so
  // only `form` — the fields deferred until the Save button — is guarded.
  const initialFormSnapshotRef = useRef(JSON.stringify(form));
  // Always the newest form state, for code that runs after an `await` and
  // would otherwise see the stale `form` its render captured (see
  // saveItem / buildPayload).
  const formRef = useRef(form);
  formRef.current = form;
  // Set once a save-and-leave has succeeded, so the page counts as clean
  // for the unsaved-changes guard while the browser navigates away.
  const leavingAfterSaveRef = useRef(false);
  const [gallery, setGallery] = useState<ImageRow[]>(
    initialGalleryImages.map((gi) => gi.images)
  );
  // Set once a create has gone through while the person is still on this
  // page (the unsaved-changes dialog's Save), so the now-saved form stops
  // counting as unsaved.
  const [justCreated, setJustCreated] = useState(false);
  const formChanged = JSON.stringify(form) !== initialFormSnapshotRef.current;
  // Update mode: only `form` counts (gallery edits save themselves). Create
  // mode: nothing exists yet, so gallery images picked before the first save
  // are unsaved work too, on top of any edited field.
  const isDirty =
    !leavingAfterSaveRef.current &&
    (mode === 'update' ? formChanged : !justCreated && (formChanged || gallery.length > 0));

  // Last snapshot already sent by a background (page-hidden) save — stops
  // visibilitychange + pagehide from sending the same edit twice. Not the
  // "clean" baseline: the form stays dirty until a real save succeeds,
  // since a keepalive request's outcome can't be observed.
  const lastBackgroundSavedRef = useRef<string | null>(null);
  function backgroundSave() {
    if (mode !== 'update' || !form.name.trim()) return;
    const snapshot = JSON.stringify(form);
    if (snapshot === initialFormSnapshotRef.current || snapshot === lastBackgroundSavedRef.current) return;
    lastBackgroundSavedRef.current = snapshot;
    fetch(`/api/v1/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
      keepalive: true,
    }).catch(() => {});
  }

  const { requestLeave, guardDialog } = useUnsavedChangesGuard(isDirty, {
    // Save from the unsaved-changes dialog: save in place, the dialog then
    // continues to wherever the person was actually heading.
    onSave: () => saveItem(false),
    onBackgroundSave: backgroundSave,
  });

  // Replaces the old "stay on this page" toggle — instead of leaving the
  // form open to re-enter the same item by hand, this creates that many
  // identical copies (each its own separate item row) in one save. Kept as
  // a string for the input's value; clampQuantity() is the single source
  // of truth for turning it into a valid 1-99 integer, used both for the
  // input's own onBlur correction and for deciding the create loop count.
  const [quantity, setQuantity] = useState('1');
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
  const status5Label = resolveLabel(settings.name_status, t('status5'));
  const statusLabel = (s: number) => (s === 5 ? status5Label : t(`status${s}`));

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

  // Invalid/empty input and anything below 1 becomes 1; anything above 99
  // is capped at 99 — mirrors the clamp-on-exit pattern used elsewhere
  // (e.g. the package tariff/shipping fee fields) rather than showing a
  // validation error.
  function clampQuantity(raw: string): number {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(99, n);
  }

  // Reads the LATEST form (formRef), not the render's closure — a save can
  // be kicked off from a handler whose closure is a render or two stale
  // (e.g. a phone keyboard's autocorrect committing the last word of the
  // description around the moment Save is tapped).
  function buildPayload(f: ItemFormData = formRef.current) {
    return {
      name: f.name,
      description: f.description || undefined,
      location_id: f.location?.id ?? null,
      barcode: settings.use_barcode && f.barcode ? f.barcode.trim() : undefined,
      status: f.status,
      category_ids: f.categories.map((c) => c.id),
      // Left out entirely when types are turned off (typesEnabled), so
      // saving never touches the item's stored type assignments — an update
      // that omits type_ids leaves them alone (see updateItem), and they
      // come back untouched if the setting is turned on again.
      type_ids: typesEnabled(settings) ? f.types.map((tp) => tp.id) : undefined,
      main_image: f.main_image?.id ?? null,
      cost_price: f.cost_price ? Number(f.cost_price) : 0,
      purchase_price: f.purchase_price ? Number(f.purchase_price) : 0,
      purchase_price_currency: f.purchase_price_currency,
      sell_price: settings.use_sell_price && f.sell_price ? Number(f.sell_price) : Number(f.sell_price || 0),
      notes: settings.use_secret_notes ? f.notes || undefined : undefined,
    };
  }

  function handleSave() {
    return saveItem(true);
  }

  // `navigate: false` is for the unsaved-changes dialog's Save button: save
  // in place and let the dialog carry on to wherever the person was going,
  // instead of this function also sending them back. Resolves true only on
  // success.
  async function saveItem(navigate: boolean): Promise<boolean> {
    if (!formRef.current.name.trim()) {
      setErrorMessage(t('nameRequired'));
      return false;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = buildPayload();

      if (mode === 'update') {
        // The form can still change while the request is in flight — typing
        // in the description during a slow save, or a phone keyboard
        // committing an autocorrect as Save is tapped. Whatever was sent
        // then no longer matches what's on screen, so after each response
        // the latest form is compared with what was sent and, if it moved,
        // sent again (a few times at most). That way the saved item always
        // equals the final form: no edit silently lost, and no false
        // "unsaved changes" warning right after a successful save.
        let savedSnapshot = '';
        for (let attempt = 0; attempt < 4; attempt++) {
          const sentForm = formRef.current;
          savedSnapshot = JSON.stringify(sentForm);
          const res = await fetch(`/api/v1/items/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildPayload(sentForm)),
          });
          const json = await res.json();

          if (!res.ok) {
            setErrorMessage(parseApiError(json, t('saveFailed')));
            return false;
          }
          if (JSON.stringify(formRef.current) === savedSnapshot) break;
        }
        // Baseline = what was actually saved. If the form STILL differs
        // (kept changing through every retry) it correctly stays dirty.
        initialFormSnapshotRef.current = savedSnapshot;

        if (!navigate) {
          // Stays on this page until the dialog navigates; refresh server
          // data so wherever we go next isn't served stale.
          router.refresh();
          return true;
        }

        // Go back to wherever this edit was opened from (items list,
        // package view, sale view, ...) instead of always the items list.
        //
        // Neither ordering of router.back()/router.refresh() reliably
        // busts the client-side Router Cache here (confirmed: an item whose
        // status changed out of the active filter kept showing in the list
        // after either ordering, even in dev, and only disappeared on a
        // full hard reload). That points to the soft back-navigation
        // itself serving the previous page straight from cache without
        // ever re-running Next's refresh invalidation in time.
        //
        // So skip the soft-navigation cache path entirely for this return
        // trip: use the raw History API to go back, then force a real
        // full-document reload once the browser finishes changing the URL
        // (the 'popstate' event fires only after window.location has
        // already updated to the previous page's address). This is
        // heavier than a client-side transition, but it's the same hard
        // reload already confirmed to always show correct, fresh data.
        // Saved, so count it as clean — otherwise the unsaved-changes
        // guard's beforeunload prompt (and background save) would fire on
        // the reload below. (The baseline was already set to the saved
        // snapshot above; this flag also forces "clean" for the re-render
        // that follows, regardless of any last-instant form change.)
        leavingAfterSaveRef.current = true;
        window.addEventListener(
          'popstate',
          () => window.location.reload(),
          { once: true }
        );
        window.history.back();
        return true;
      }

      // Create mode: repeat the same create call `quantity` times — each
      // call makes its own independent item row (and its own copy of the
      // picked gallery images), not a single item with a count field.
      const copies = clampQuantity(quantity);
      for (let i = 0; i < copies; i++) {
        const res = await fetch('/api/v1/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (!res.ok) {
          setErrorMessage(parseApiError(json, t('saveFailed')));
          return false;
        }

        // Attach any gallery images picked before the item existed.
        if (gallery.length > 0) {
          await Promise.all(
            gallery.map((img) =>
              fetch(`/api/v1/items/${json.data.id}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_id: img.id }),
              })
            )
          );
        }
      }

      // Created, so nothing here is unsaved anymore (matters for the
      // unsaved-changes dialog's Save, which continues to its own
      // destination instead of this push).
      setJustCreated(true);
      if (navigate) router.push('/dashboard/items');
      return true;
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
            <DocumentDuplicateIcon style={{ width: '18px', height: '18px' }} />
            {t('createFromBlueprint')}
          </Button>
        )}
        {mode === 'update' && (
          <button
            type="button"
            onClick={() => requestLeave(() => router.back())}
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
                galleryImages={gallery}
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
                      <option key={s} value={s}>{statusLabel(s)}</option>
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

                {typesEnabled(settings) && (
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
                )}
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
              mainImage={form.main_image}
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
                <Tooltip text={t('purchasePriceHint')}>
                  <span className="stat-box-label">{t('purchasePrice')}</span>
                </Tooltip>
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
                <Tooltip text={t('priceCurrencyHint')}>
                  <span className="stat-box-currency">{shopSellCurrency?.currency_code ?? ''}</span>
                </Tooltip>
              </div>
              <div className="stat-box">
                <Tooltip text={t('costPriceHint')}>
                  <span className="stat-box-label">{t('costPrice')}</span>
                </Tooltip>
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
                  <Tooltip text={t('priceCurrencyHint')}>
                    <span className="stat-box-currency">{shopSellCurrency?.currency_code ?? ''}</span>
                  </Tooltip>
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
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)', alignSelf: 'flex-start' }}>
              {t('quantity')}
              <input
                type="number"
                min="1"
                max="99"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={(e) => setQuantity(String(clampQuantity(e.target.value)))}
                className="sheet-input"
                style={{ width: '4em', textAlign: 'center' }}
              />
            </label>
          )}

          {errorMessage && <div style={{ color: 'var(--color-danger)' }}>{errorMessage}</div>}

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('saving') : t('save')}
            </Button>
            {/* Available in update mode too, for when you forgot to save a
                blueprint while creating the item. Uses the form's current
                values (saved or not) and doesn't touch the item itself. */}
            <Button onClick={handleSaveAsBlueprint} disabled={isSavingBlueprint} title={t('saveAsBlueprintHint')}>
              <BookmarkSquareIcon style={{ width: '18px', height: '18px' }} />
              {isSavingBlueprint ? t('saving') : t('saveAsBlueprint')}
            </Button>
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

      {typesEnabled(settings) && typeModalOpen && (
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

      {guardDialog}

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