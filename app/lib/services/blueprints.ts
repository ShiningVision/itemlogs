import { supabase } from '../../lib/db/client';
import type { CreateBlueprintInput, UpdateBlueprintInput } from '../../lib/validation/blueprints';

// Thrown by createBlueprint/updateBlueprint when the barcode being saved is
// already used by another blueprint. Unlike items (whose barcode is
// intentionally allowed to repeat — see getAvailableItemByBarcode),
// blueprints are meant to be looked up by barcode as a stable "this scan
// means this blueprint" mapping (see applyBlueprint's caller,
// ItemForm's scan handler), so a duplicate here would make that lookup
// ambiguous. A distinct error class lets the API routes tell this apart
// from a generic failure and return a specific error code.
export class DuplicateBarcodeError extends Error {
  constructor() {
    super('duplicateBarcode');
    this.name = 'DuplicateBarcodeError';
  }
}

async function assertBarcodeAvailable(barcode: string | null | undefined, excludeId?: number) {
  if (!barcode) return;

  let query = supabase.from('blueprints').select('id').eq('barcode', barcode);
  if (excludeId !== undefined) query = query.neq('id', excludeId);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  if (data) throw new DuplicateBarcodeError();
}

// Same many-to-many shape as items (see app/lib/services/items.ts) —
// blueprint_categories/blueprint_types nested joins, flattened into plain
// `categories`/`types` arrays for callers.
// Typed as plain `string` — Supabase-JS's `.select()` overload otherwise
// tries to parse a literal select string at the type level, and its parser
// fails on this shape's nested embedded resources (see the identical
// comment on ITEM_SELECT in app/lib/services/items.ts, where this first
// broke the build).
const BLUEPRINT_SELECT: string = `
  *,
  images:main_image(url),
  location_ref:location_id(name),
  blueprint_categories(category:categories(id, name)),
  blueprint_types(type:types(id, name))
`;

function flattenBlueprintJoins<T extends Record<string, any>>(row: T): T {
  if (!row) return row;
  const categories = ((row as any).blueprint_categories ?? [])
    .map((r: any) => r.category)
    .filter(Boolean);
  const types = ((row as any).blueprint_types ?? [])
    .map((r: any) => r.type)
    .filter(Boolean);
  const { blueprint_categories, blueprint_types, ...rest } = row as any;
  return { ...rest, categories, types } as T;
}

async function replaceBlueprintCategories(blueprintId: number, categoryIds: number[]) {
  const { error: deleteError } = await supabase.from('blueprint_categories').delete().eq('blueprint_id', blueprintId);
  if (deleteError) throw deleteError;
  if (categoryIds.length === 0) return;

  const { error: insertError } = await supabase
    .from('blueprint_categories')
    .insert(categoryIds.map((category_id) => ({ blueprint_id: blueprintId, category_id })));
  if (insertError) throw insertError;
}

async function replaceBlueprintTypes(blueprintId: number, typeIds: number[]) {
  const { error: deleteError } = await supabase.from('blueprint_types').delete().eq('blueprint_id', blueprintId);
  if (deleteError) throw deleteError;
  if (typeIds.length === 0) return;

  const { error: insertError } = await supabase
    .from('blueprint_types')
    .insert(typeIds.map((type_id) => ({ blueprint_id: blueprintId, type_id })));
  if (insertError) throw insertError;
}

export async function getBlueprints() {
  const { data, error } = await supabase
    .from('blueprints')
    .select(BLUEPRINT_SELECT)
    .order('id', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(flattenBlueprintJoins);
}

export async function getBlueprintById(id: number) {
  const { data, error } = await supabase
    .from('blueprints')
    .select(BLUEPRINT_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;
  return flattenBlueprintJoins(data);
}

// Barcode-to-blueprint lookup for ItemForm's "scan barcode while creating an
// item" flow — if the scanned code matches a saved blueprint, that
// blueprint's details are applied to the form automatically. Exact match,
// case-sensitive (same as items' barcode lookups elsewhere in the app).
export async function getBlueprintByBarcode(barcode: string) {
  const { data, error } = await supabase
    .from('blueprints')
    .select(BLUEPRINT_SELECT)
    .eq('barcode', barcode)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? flattenBlueprintJoins(data) : data;
}

export async function createBlueprint(input: CreateBlueprintInput) {
  await assertBarcodeAvailable(input.barcode);

  const { category_ids, type_ids, ...blueprintFields } = input;

  const { data, error } = await supabase
    .from('blueprints')
    .insert(blueprintFields)
    .select()
    .single();

  if (error) throw error;

  await Promise.all([
    replaceBlueprintCategories(data.id, category_ids ?? []),
    replaceBlueprintTypes(data.id, type_ids ?? []),
  ]);

  return getBlueprintById(data.id);
}

export async function updateBlueprint(id: number, input: UpdateBlueprintInput) {
  await assertBarcodeAvailable(input.barcode, id);

  const { category_ids, type_ids, ...blueprintFields } = input;

  const { data, error } = await supabase
    .from('blueprints')
    .update(blueprintFields)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await Promise.all([
    category_ids !== undefined ? replaceBlueprintCategories(id, category_ids) : Promise.resolve(),
    type_ids !== undefined ? replaceBlueprintTypes(id, type_ids) : Promise.resolve(),
  ]);

  return getBlueprintById(id);
}

export async function deleteBlueprint(id: number) {
  const { error } = await supabase
    .from('blueprints')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
