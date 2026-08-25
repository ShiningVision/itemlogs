// app/lib/items/exportItems.ts
import ExcelJS from 'exceljs';

// Columns are deliberately explicit (not a raw dump of the items table) —
// package_id, gallery images, and is_featured are internal/organizational
// concerns, not part of an item's portable record. Shared between the
// items-list export and the per-sale export so both stay in sync.
export const ITEM_EXPORT_COLUMNS: { header: string; key: string; width?: number }[] = [
  { header: 'id', key: 'id', width: 8 },
  { header: 'name', key: 'name', width: 28 },
  { header: 'status', key: 'status', width: 10 },
  { header: 'type', key: 'type', width: 18 },
  { header: 'category', key: 'category', width: 18 },
  { header: 'location', key: 'location', width: 18 },
  { header: 'description', key: 'description', width: 40 },
  { header: 'barcode', key: 'barcode', width: 16 },
  { header: 'main_image', key: 'main_image', width: 40 },
  { header: 'purchase_price', key: 'purchase_price', width: 14 },
  { header: 'purchase_price_currency', key: 'purchase_price_currency', width: 12 },
  { header: 'cost_price', key: 'cost_price', width: 12 },
  { header: 'sell_price', key: 'sell_price', width: 12 },
  { header: 'notes', key: 'notes', width: 30 },
];
// sell_price_currency deliberately isn't a column: every item's sell_price
// and cost_price are always in the single shop-wide settings.sell_price_currency,
// so it's not per-item data anymore (see app/lib/services/settings.ts).

// Columns whose presence depends on a tenant's use_* settings, rather than
// always being included — a disabled feature's data shouldn't show up in an
// export any more than it shows up in the UI. Owner-triggered exports are
// private (not the storefront), so the columns that ARE included are shown
// in full, unredacted; this only controls which columns exist at all.
type ExportGateSettings = { use_sell_price: boolean; use_barcode: boolean; use_secret_notes: boolean };

export function getItemExportColumns(settings: ExportGateSettings) {
  return ITEM_EXPORT_COLUMNS.filter((column) => {
    if (column.key === 'sell_price') return settings.use_sell_price;
    if (column.key === 'barcode') return settings.use_barcode;
    if (column.key === 'notes') return settings.use_secret_notes;
    return true;
  });
}

// Minimal shape each exportable item row must satisfy — matches the joined
// shape produced by ITEM_SELECT in items.ts as well as the sale-items join.
export type ExportableItem = {
  id: number;
  name: string | null;
  status: number;
  description?: string | null;
  barcode?: string | null;
  // Many-to-many now — see app/lib/services/items.ts's flattenItemJoins.
  types?: { id: number; name: string | null }[];
  categories?: { id: number; name: string | null }[];
  location_ref?: { name: string } | null;
  main_image_ref?: { url: string } | null;
  purchase_price: number | null;
  purchase_currency?: { currency_code: string } | null;
  cost_price: number | null;
  sell_price: number | null;
  notes?: string | null;
};

export async function buildItemsWorkbook(
  items: ExportableItem[],
  settings: ExportGateSettings
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Items');
  const columns = getItemExportColumns(settings);
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  // Barcodes are stored as text (leading zeros, non-numeric formats) —
  // force the column to a text number format so Excel doesn't try to
  // reinterpret numeric-looking values and strip leading zeros on open.
  // Only set if the column is actually present (use_barcode may be off).
  if (settings.use_barcode) {
    sheet.getColumn('barcode').numFmt = '@';
  }

  for (const item of items) {
    sheet.addRow({
      id: item.id,
      name: item.name,
      status: item.status,
      // Many-to-many now: multiple names join into one cell with a plain
      // comma. An empty assignment writes the literal "Other" (same
      // convention the old scalar column used for null) — importItems.ts's
      // resolveTypes/resolveCategories special-case this exact string back
      // to an empty array on the way in, so a round-trip export -> reimport
      // doesn't recreate a real "Other" category/type row. A name that
      // itself contains a comma isn't supported by this format (see the
      // CJK delimiter list in resolveCategories/resolveTypes for what
      // splits a cell into multiple names on import).
      type: item.types?.length ? item.types.map((t) => t.name).join(', ') : 'Other',
      category: item.categories?.length ? item.categories.map((c) => c.name).join(', ') : 'Other',
      // Unlike type/category, a null location has no "Other" sentinel
      // convention (see the comment above the `locations` seed array in
      // placeholder-data.ts) — it just means "no location", so a blank
      // cell round-trips correctly instead of a literal string.
      location: item.location_ref?.name ?? '',
      description: item.description,
      barcode: item.barcode,
      main_image: item.main_image_ref?.url ?? '',
      purchase_price: item.purchase_price,
      purchase_price_currency: item.purchase_currency?.currency_code ?? '',
      cost_price: item.cost_price,
      sell_price: item.sell_price,
      notes: item.notes,
      // Extra keys not present in `columns` (e.g. sell_price/barcode/notes
      // when their use_* toggle is off) are simply ignored by exceljs.
    });
  }

  return workbook.xlsx.writeBuffer();
}

// Builds a safe filename with the date before the name, e.g. "2026-07-19-Summer Sale.xlsx".
export function buildExportFilename(date: string, name: string | null | undefined): string {
  const safeName = (name || 'sale').trim().replace(/[\\/:*?"<>|]+/g, '-');
  return `${date}-${safeName}.xlsx`;
}
