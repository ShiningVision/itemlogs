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