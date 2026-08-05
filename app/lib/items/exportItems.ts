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
];
// sell_price_currency deliberately isn't a column: every item's sell_price
// and cost_price are always in the single shop-wide settings.sell_price_currency,
// so it's not per-item data anymore (see app/lib/services/settings.ts).

// Minimal shape each exportable item row must satisfy — matches the joined
// shape produced by ITEM_SELECT in items.ts as well as the sale-items join.
export type ExportableItem = {
  id: number;
  name: string | null;
  status: number;
  location?: string | null;
  description?: string | null;
  barcode?: string | null;
  type_ref?: { name: string } | null;
  category_ref?: { name: string } | null;
  main_image_ref?: { url: string } | null;
  purchase_price: number | null;
  purchase_currency?: { currency_code: string } | null;
  cost_price: number | null;
  sell_price: number | null;
};

export async function buildItemsWorkbook(items: ExportableItem[]): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Items');
  sheet.columns = ITEM_EXPORT_COLUMNS;
  sheet.getRow(1).font = { bold: true };
  // Barcodes are stored as text (leading zeros, non-numeric formats) —
  // force the column to a text number format so Excel doesn't try to
  // reinterpret numeric-looking values and strip leading zeros on open.
  sheet.getColumn('barcode').numFmt = '@';

  for (const item of items) {
    sheet.addRow({
      id: item.id,
      name: item.name,
      status: item.status,
      // Null type/category is "Other" everywhere it's displayed (see
      // app/lib/placeholder-data.ts) — write that literally instead of a
      // blank cell. importItems.ts's resolveType/resolveCategory special-case
      // this exact string back to null on the way in, so a round-trip
      // export -> reimport doesn't recreate a real "Other" category/type row.
      type: item.type_ref?.name ?? 'Other',
      category: item.category_ref?.name ?? 'Other',
      location: item.location,
      description: item.description,
      barcode: item.barcode,
      main_image: item.main_image_ref?.url ?? '',
      purchase_price: item.purchase_price,
      purchase_price_currency: item.purchase_currency?.currency_code ?? '',
      cost_price: item.cost_price,
      sell_price: item.sell_price,
    });
  }

  return workbook.xlsx.writeBuffer();
}

// Builds a safe filename with the date before the name, e.g. "2026-07-19-Summer Sale.xlsx".
export function buildExportFilename(date: string, name: string | null | undefined): string {
  const safeName = (name || 'sale').trim().replace(/[\\/:*?"<>|]+/g, '-');
  return `${date}-${safeName}.xlsx`;
}
