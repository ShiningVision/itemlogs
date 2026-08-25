// app/lib/items/importItems.ts
// Core logic for the Items "Import from Excel" feature. Deliberately kept
// out of the API route so the route stays a thin HTTP wrapper.
//
// Flow:
//   1. Validate the workbook's shape (exact column layout matching the
//      export) — abort immediately if wrong.
//   2. Parse every data row and run a full validation scan (status must be
//      1-4, purchase/cost/sell price must be numeric, purchase_price_currency
//      must exist, ids — if given — must reference an existing item). Nothing
//      is written to the database yet. If ANY row fails ANY of these
//      checks, the whole import is aborted and every problem found is
//      reported together.
//   3. Only once the scan is clean do we start mutating: create missing
//      categories/types as we encounter their names, resolve each row's
//      main_image (existing stored image / already-fetched-this-run
//      external image / brand-new external image to fetch+compress+
//      upload), and create or update the item itself (id present ->
//      update, blank -> create).
//
// Note on partial failure: steps 1-2 are a hard gate (nothing written if
// they fail). Step 3 is not wrapped in a database transaction (the
// Supabase client here doesn't give us one) — if an individual row fails
// during the mutation pass (e.g. a transient DB error), it's reported as a
// row error and the rest of the import continues rather than rolling back
// rows already written.

import ExcelJS from 'exceljs';
import { getItemsByIds, createItem, updateItem } from '@/app/lib/services/items';
import { getCategories, createCategory } from '@/app/lib/services/categories';
import { getTypes, createType } from '@/app/lib/services/types';
import { getLocations, createLocation } from '@/app/lib/services/locations';
import { getCurrencies } from '@/app/lib/services/currencies';
import { getImageByUrl, createImage } from '@/app/lib/services/images';
import { uploadImageBuffer } from '@/app/lib/storage/images';

const EXPECTED_HEADERS = [
  'id',
  'name',
  'status',
  'type',
  'category',
  'location',
  'description',
  'barcode',
  'main_image',
  'purchase_price',
  'purchase_price_currency',
  'cost_price',
  'sell_price',
];

export type ImportResult =
  | {
      success: true;
      created: number;
      updated: number;
      categoriesCreated: number;
      typesCreated: number;
      locationsCreated: number;
      imagesFetched: number;
      imagesSkipped: number;
      rowErrors: string[];
    }
  | { success: false; error: string; details?: string[] };

type ParsedRow = {
  rowNumber: number;
  id: number | null;
  name: string;
  status: number;
  type: string | null;
  category: string | null;
  location: string | null;
  description: string | null;
  barcode: string | null;
  main_image: string | null;
  purchase_price: number;
  purchase_price_currency: string;
  cost_price: number;
  sell_price: number;
};

function cellToString(value: ExcelJS.CellValue): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('text' in (value as any) && typeof (value as any).text === 'string') return (value as any).text;
    if ('richText' in (value as any) && Array.isArray((value as any).richText)) {
      return (value as any).richText.map((r: any) => r.text).join('');
    }
    if ('result' in (value as any)) return cellToString((value as any).result);
    return null;
  }
  const str = String(value).trim();
  return str === '' ? null : str;
}

export async function importItemsFromExcel(buffer: Buffer): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as any);
  } catch {
    return { success: false, error: 'Could not read this file. Please upload a .xlsx file exported from Itemlogs.' };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { success: false, error: 'The workbook has no sheets.' };
  }

  // ---- 1. Shape check — exact column layout, same order, no extras ----
  const headerRow = sheet.getRow(1);
  for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
    const actual = (cellToString(headerRow.getCell(i + 1).value) ?? '').toLowerCase();
    if (actual !== EXPECTED_HEADERS[i]) {
      return {
        success: false,
        error: `This file doesn't match the expected column layout. Expected column ${i + 1} to be "${EXPECTED_HEADERS[i]}" but found "${actual || '(empty)'}". Please use a file exported from Itemlogs.`,
      };
    }
  }
  const extraHeader = cellToString(headerRow.getCell(EXPECTED_HEADERS.length + 1).value);
  if (extraHeader) {
    return {
      success: false,
      error: `This file has an unexpected extra column ("${extraHeader}"). Please use a file exported from Itemlogs.`,
    };
  }

  // ---- 2. Parse rows + full validation scan (nothing written yet) ----
  const currencies = await getCurrencies();
  const currencyCodes = new Set(currencies.map((c) => c.currency_code));

  const rows: ParsedRow[] = [];
  const statusErrors: string[] = [];
  const priceErrors: string[] = [];
  const currencyErrors: string[] = [];
  const idFormatErrors: string[] = [];
  const nameErrors: string[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header row

    const get = (col: number) => cellToString(row.getCell(col).value);
    const idStr = get(1);
    const name = get(2);
    const statusStr = get(3);
    const type = get(4);
    const category = get(5);
    const location = get(6);
    const description = get(7);
    const barcode = get(8);
    const main_image = get(9);
    const purchasePriceStr = get(10);
    const purchase_price_currency = get(11);
    const costPriceStr = get(12);
    const sellPriceStr = get(13);

    const allBlank = [
      idStr, name, statusStr, type, category, location, description, barcode,
      main_image, purchasePriceStr, purchase_price_currency, costPriceStr,
      sellPriceStr,
    ].every((v) => v === null);
    if (allBlank) return;

    let id: number | null = null;
    if (idStr !== null) {
      const n = Number(idStr);
      // Item ids are Postgres integers — reject anything non-numeric
      // (letters, symbols, a Mongo-style ObjectId, etc.) as well as
      // numeric-looking-but-fractional values like "1.5", which would
      // otherwise slip past this check and only fail later as a raw
      // database error instead of a clean, reported row error.
      if (!Number.isInteger(n)) {
        idFormatErrors.push(`Row ${rowNumber}: "id" is not a valid whole number ("${idStr}").`);
      } else {
        id = n;
      }
    }

    if (id === null && !name) {
      nameErrors.push(`Row ${rowNumber}: "name" is required when creating a new item (id is empty).`);
    }

    const statusNum = statusStr !== null ? Number(statusStr) : NaN;
    if (!Number.isFinite(statusNum) || ![1, 2, 3, 4].includes(statusNum)) {
      statusErrors.push(`Row ${rowNumber}: "status" must be 1, 2, 3, or 4 (found "${statusStr ?? '(empty)'}").`);
    }

    function parsePrice(label: string, str: string | null): number {
      if (str === null) return 0;
      const n = Number(str);
      if (!Number.isFinite(n)) {
        priceErrors.push(`Row ${rowNumber}: "${label}" must be a number (found "${str}").`);
        return 0;
      }
      return n;
    }
    const purchase_price = parsePrice('purchase_price', purchasePriceStr);
    const cost_price = parsePrice('cost_price', costPriceStr);
    const sell_price = parsePrice('sell_price', sellPriceStr);

    if (purchase_price_currency === null || !currencyCodes.has(purchase_price_currency)) {
      currencyErrors.push(`Row ${rowNumber}: unsupported currency "${purchase_price_currency ?? '(empty)'}" in purchase_price_currency.`);
    }

    rows.push({
      rowNumber,
      id,
      name: name ?? '',
      status: Number.isFinite(statusNum) ? statusNum : 0,
      type,
      category,
      location,
      description,
      barcode,
      main_image,
      purchase_price,
      purchase_price_currency: purchase_price_currency ?? '',
      cost_price,
      sell_price,
    });
  });

  // id existence check (batched)
  const idsToCheck = rows.map((r) => r.id).filter((id): id is number => id !== null);
  const existingIds = await getItemsByIds(idsToCheck);
  const missingIdErrors: string[] = [];
  for (const row of rows) {
    if (row.id !== null && !existingIds.has(row.id)) {
      missingIdErrors.push(`Row ${row.rowNumber}: item id ${row.id} does not exist.`);
    }
  }

  const allErrors = [...idFormatErrors, ...nameErrors, ...statusErrors, ...priceErrors, ...currencyErrors, ...missingIdErrors];
  if (allErrors.length > 0) {
    return {
      success: false,
      error: 'Import aborted — this file has problems that need fixing first.',
      details: allErrors,
    };
  }

  if (rows.length === 0) {
    return { success: true, created: 0, updated: 0, categoriesCreated: 0, typesCreated: 0, locationsCreated: 0, imagesFetched: 0, imagesSkipped: 0, rowErrors: [] };
  }

  // ---- 3. Mutation pass ----
  const currencyCodeToId = new Map(currencies.map((c) => [c.currency_code, c.id]));

  const categoriesList = await getCategories();
  const categoryNameToId = new Map<string, number>((categoriesList ?? []).map((c: any) => [c.name, c.id]));
  let categoriesCreated = 0;

  const typesList = await getTypes();
  const typeNameToId = new Map<string, number>((typesList ?? []).map((t: any) => [t.name, t.id]));
  let typesCreated = 0;

  const locationsList = await getLocations();
  const locationNameToId = new Map<string, number>((locationsList ?? []).map((l: any) => [l.name, l.id]));
  let locationsCreated = 0;

  // "Other" isn't a real category/type row (see app/lib/placeholder-data.ts)
  // — it's how a null category/type is displayed and how exportItems.ts
  // writes it to the sheet. Treat that exact text (case-insensitively,
  // trimmed) as null on the way back in, instead of creating a real "Other"
  // row every time an exported sheet gets reimported.
  function isOtherLabel(name: string): boolean {
    return name.trim().toLowerCase() === 'other';
  }

  // Many-to-many now: a cell can hold several names. Split on a plain comma
  // plus the fullwidth comma "，" (U+FF0C) and ideographic comma "、"
  // (U+3001), covering every seeded locale (en, de, zh, ja, ko, fr, es) —
  // matches what exportItems.ts's plain-comma join can round-trip, and
  // additionally tolerates a sheet edited by hand in a CJK locale.
  function splitMultiValue(cell: string | null): string[] {
    if (!cell) return [];
    return cell
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  const importWarnings: string[] = [];

  async function resolveCategories(name: string | null, rowNumber: number): Promise<number[]> {
    const tokens = splitMultiValue(name);
    const otherTokens = tokens.filter(isOtherLabel);
    const realTokens = tokens.filter((t) => !isOtherLabel(t));
    // "Other" isn't a real row (see app/lib/placeholder-data.ts) — a lone
    // "Other" (or several, e.g. "Other, Other") means "no categories",
    // same meaning a null scalar used to have. "Other" mixed in alongside
    // real names is almost certainly a mistake (can't be "no categories"
    // and "Electronics" at once) — drop it and warn, rather than silently
    // creating a real "Other" category row.
    if (otherTokens.length > 0 && realTokens.length > 0) {
      importWarnings.push(`Row ${rowNumber}: "Other" ignored in category — mixed with real category names.`);
    }
    if (realTokens.length === 0) return [];

    const ids: number[] = [];
    for (const t of realTokens) {
      const existing = categoryNameToId.get(t);
      if (existing !== undefined) {
        ids.push(existing);
        continue;
      }
      const created = await createCategory({ name: t });
      categoryNameToId.set(t, created.id);
      categoriesCreated++;
      ids.push(created.id);
    }
    return ids;
  }

  async function resolveTypes(name: string | null, rowNumber: number): Promise<number[]> {
    const tokens = splitMultiValue(name);
    const otherTokens = tokens.filter(isOtherLabel);
    const realTokens = tokens.filter((t) => !isOtherLabel(t));
    if (otherTokens.length > 0 && realTokens.length > 0) {
      importWarnings.push(`Row ${rowNumber}: "Other" ignored in type — mixed with real type names.`);
    }
    if (realTokens.length === 0) return [];

    const ids: number[] = [];
    for (const t of realTokens) {
      const existing = typeNameToId.get(t);
      if (existing !== undefined) {
        ids.push(existing);
        continue;
      }
      const created = await createType({ name: t });
      typeNameToId.set(t, created.id);
      typesCreated++;
      ids.push(created.id);
    }
    return ids;
  }

  // Unlike category/type, a blank location cell has no "Other" sentinel
  // convention to special-case here — an empty cell (or a location name that
  // happens to literally be "Other") is just resolved/created like any other
  // name, since a null location_id already means "no location" everywhere
  // it's displayed.
  async function resolveLocation(name: string | null): Promise<number | null> {
    if (!name) return null;
    const existing = locationNameToId.get(name);
    if (existing !== undefined) return existing;
    const created = await createLocation({ name });
    locationNameToId.set(name, created.id);
    locationsCreated++;
    return created.id;
  }

  // The dedup map described in the spec: original external image URL ->
  // the Vercel Blob URL we uploaded it to. Prevents re-downloading and
  // re-uploading the same external image if it's referenced by multiple
  // rows in the same import.
  const externalUrlToBlobUrl = new Map<string, string>();
  // Companion cache (not the map itself, just bookkeeping) so a repeated
  // external URL doesn't need a second `images` table lookup once we
  // already know its row id from earlier in this run.
  const blobUrlToImageId = new Map<string, number>();

  let imagesFetched = 0;
  let imagesSkipped = 0;

  async function resolveMainImage(url: string | null): Promise<number | null> {
    if (!url) return null;

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      imagesSkipped++;
      return null; // invalid URL — skip, per spec (don't abort the row)
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      imagesSkipped++;
      return null;
    }

    // Already one of our own stored images (e.g. re-importing a previous export)?
    const existingImage = await getImageByUrl(url);
    if (existingImage) return existingImage.id;

    // Already fetched earlier in this same import run?
    const cachedBlobUrl = externalUrlToBlobUrl.get(url);
    if (cachedBlobUrl) {
      const cachedId = blobUrlToImageId.get(cachedBlobUrl);
      if (cachedId !== undefined) return cachedId;
    }

    // New external URL — fetch, compress, upload, and remember it.
    try {
      const response = await fetch(url);
      if (!response.ok) {
        imagesSkipped++;
        return null;
      }
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) {
        imagesSkipped++;
        return null;
      }

      const original = Buffer.from(await response.arrayBuffer());
      const sharp = (await import('sharp')).default;
      const compressed = await sharp(original)
        .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();

      const filename = (parsed.pathname.split('/').pop() || 'image').replace(/\.[a-zA-Z0-9]+$/, '') + '.jpg';
      const blobUrl = await uploadImageBuffer(compressed, filename, 'image/jpeg');
      const createdImage = await createImage(blobUrl);

      externalUrlToBlobUrl.set(url, blobUrl);
      blobUrlToImageId.set(blobUrl, createdImage.id);
      imagesFetched++;
      return createdImage.id;
    } catch {
      imagesSkipped++;
      return null;
    }
  }

  let created = 0;
  let updated = 0;
  const rowErrors: string[] = [];

  for (const row of rows) {
    try {
      const categoryIds = await resolveCategories(row.category, row.rowNumber);
      const typeIds = await resolveTypes(row.type, row.rowNumber);
      const locationId = await resolveLocation(row.location);
      const mainImageId = await resolveMainImage(row.main_image);

      const payload = {
        name: row.name,
        // Blank description/barcode leave the existing value alone on
        // update (they're omitted, not nulled) — main_image, category_ids,
        // type_ids, and location_id support explicit clearing instead,
        // since those are the nullable/lookup fields in the schema (an
        // empty array explicitly clears every category/type assignment,
        // same as importing a row with "Other" in that cell).
        description: row.description ?? undefined,
        barcode: row.barcode ?? undefined,
        status: row.status,
        category_ids: categoryIds,
        type_ids: typeIds,
        location_id: locationId,
        main_image: mainImageId,
        cost_price: row.cost_price,
        purchase_price: row.purchase_price,
        purchase_price_currency: currencyCodeToId.get(row.purchase_price_currency)!,
        // sell_price is always in the shop-wide settings.sell_price_currency —
        // no per-item currency to resolve/write here anymore.
        sell_price: row.sell_price,
      };

      if (row.id !== null) {
        await updateItem(row.id, payload);
        updated++;
      } else {
        await createItem(payload);
        created++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      rowErrors.push(`Row ${row.rowNumber}: failed to save — ${message}.`);
    }
  }

  return {
    success: true,
    created,
    updated,
    categoriesCreated,
    typesCreated,
    locationsCreated,
    imagesFetched,
    imagesSkipped,
    // Non-fatal "Other mixed with real names" notices (see resolveCategories/
    // resolveTypes) surface through the same rowErrors channel as actual
    // save failures — there's no separate warnings field in the UI, and
    // both are informational once we're past the hard validation gate.
    rowErrors: [...importWarnings, ...rowErrors],
  };
}
