// lib/services/item-images.ts
import { supabase } from '../../lib/db/client';

type ImageRow = { id: number; url: string };


export async function getItemImages(itemId: number): Promise<{ image_id: number; images: ImageRow }[]> {
  const { data, error } = await supabase
    .from('item_images')
    .select('image_id, images(*)')
    .eq('item_id', itemId);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    image_id: row.image_id,
    images: Array.isArray(row.images) ? row.images[0] : row.images,
  }));
}

export async function addItemImage(itemId: number, imageId: number) {
  const { data, error } = await supabase
    .from('item_images')
    .insert({ item_id: itemId, image_id: imageId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeItemImage(itemId: number, imageId: number) {
  const { error } = await supabase
    .from('item_images')
    .delete()
    .eq('item_id', itemId)
    .eq('image_id', imageId);

  if (error) throw error;
}