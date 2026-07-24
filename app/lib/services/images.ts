import { supabase } from '../../lib/db/client';
import { deleteImageFile } from '../../lib/storage/images';
export async function getImages(options: { limit?: number; offset?: number } = {}) {
  let query = supabase
    .from('images')
    .select('*', { count: 'exact' })
    .order('id', { ascending: false });

  if (options.limit !== undefined && options.offset !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { images: data ?? [], totalCount: count ?? 0 };
}

export async function createImage(url: string) {
  const { data, error } = await supabase
    .from('images')
    .insert({ url })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Used by the Excel import to detect (a) rows whose main_image is already
// one of our own stored images (re-importing a previous export), and (b)
// external URLs it has already fetched+re-uploaded earlier in the same
// import run.
export async function getImageByUrl(url: string) {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('url', url)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getImageById(id: number) {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// NOTE: Possible race condition if image is deleted from storage but not from database, or vice versa. Deemed non critical issue.
export async function deleteImage(id: number) {
  const image = await getImageById(id);

  await deleteImageFile(image.url);

  const { error } = await supabase
    .from('images')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Bulk variant for the Gallery's multi-select delete — deletes each Blob
// file individually (no batch API) but does the DB delete in one query.
export async function deleteImages(ids: number[]) {
  if (ids.length === 0) return;

  const { data: rows, error: fetchError } = await supabase
    .from('images')
    .select('id, url')
    .in('id', ids);

  if (fetchError) throw fetchError;

  await Promise.all((rows ?? []).map((row) => deleteImageFile(row.url)));

  const { error } = await supabase.from('images').delete().in('id', ids);
  if (error) throw error;
}

// Returns the set of image ids referenced by an item's main image, a
// blueprint's main image, or an item's gallery (item_images) — i.e.
// everything that is NOT orphaned. Used by the Gallery page to flag unused
// images for cleanup.
export async function getReferencedImageIds(): Promise<Set<number>> {
  const [itemsRes, blueprintsRes, itemImagesRes] = await Promise.all([
    supabase.from('items').select('main_image').not('main_image', 'is', null),
    supabase.from('blueprints').select('main_image').not('main_image', 'is', null),
    supabase.from('item_images').select('image_id'),
  ]);

  if (itemsRes.error) throw itemsRes.error;
  if (blueprintsRes.error) throw blueprintsRes.error;
  if (itemImagesRes.error) throw itemImagesRes.error;

  const referenced = new Set<number>();
  for (const row of itemsRes.data ?? []) referenced.add(row.main_image);
  for (const row of blueprintsRes.data ?? []) referenced.add(row.main_image);
  for (const row of itemImagesRes.data ?? []) referenced.add(row.image_id);

  return referenced;
}