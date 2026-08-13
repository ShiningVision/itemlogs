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

export async function getBlueprints() {
  const { data, error } = await supabase
    .from('blueprints')
    .select('*, images:main_image(url)')
    .order('id', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBlueprintById(id: number) {
  const { data, error } = await supabase
    .from('blueprints')
    .select('*, images:main_image(url)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Barcode-to-blueprint lookup for ItemForm's "scan barcode while creating an
// item" flow — if the scanned code matches a saved blueprint, that
// blueprint's details are applied to the form automatically. Exact match,
// case-sensitive (same as items' barcode lookups elsewhere in the app).
export async function getBlueprintByBarcode(barcode: string) {
  const { data, error } = await supabase
    .from('blueprints')
    .select('*, images:main_image(url)')
    .eq('barcode', barcode)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createBlueprint(input: CreateBlueprintInput) {
  await assertBarcodeAvailable(input.barcode);

  const { data, error } = await supabase
    .from('blueprints')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBlueprint(id: number, input: UpdateBlueprintInput) {
  await assertBarcodeAvailable(input.barcode, id);

  const { data, error } = await supabase
    .from('blueprints')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBlueprint(id: number) {
  const { error } = await supabase
    .from('blueprints')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
