// app/lib/services/documents.ts
import { supabase } from '../../lib/db/client';
import { deleteDocumentFile } from '../../lib/storage/documents';

export type DocumentRow = {
  id: number;
  package_id: number;
  url: string;
  filename: string;
  content_type: string | null;
};

// All documents, across every package — used by the Gallery page (which,
// like its image view, shows the full library rather than a DB-paginated
// page; sort/filter/pagination all happen client-side there).
export async function getDocuments(): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('id', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getDocumentsByPackageId(packageId: number): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('package_id', packageId)
    .order('id', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getDocumentById(id: number): Promise<DocumentRow> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createDocument(input: {
  package_id: number;
  url: string;
  filename: string;
  content_type: string | null;
}): Promise<DocumentRow> {
  const { data, error } = await supabase
    .from('documents')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// NOTE: same possible race condition as deleteImage in images.ts (blob
// deleted but DB row survives, or vice versa, if one step throws) — deemed
// non-critical there and equally so here.
export async function deleteDocument(id: number): Promise<void> {
  const doc = await getDocumentById(id);

  await deleteDocumentFile(doc.url);

  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

// Bulk variant for the Gallery's multi-select delete — mirrors deleteImages.
export async function deleteDocuments(ids: number[]): Promise<void> {
  if (ids.length === 0) return;

  const { data: rows, error: fetchError } = await supabase
    .from('documents')
    .select('id, url')
    .in('id', ids);

  if (fetchError) throw fetchError;

  await Promise.all((rows ?? []).map((row) => deleteDocumentFile(row.url)));

  const { error } = await supabase.from('documents').delete().in('id', ids);
  if (error) throw error;
}

// Deletes every document (blob + row) belonging to a package — call this
// before deletePackage(). Unlike images, documents aren't shared/reusable
// across owners (each belongs to exactly one package), so ON DELETE CASCADE
// on the `documents.package_id` FK is enough to clean up the DB rows, but it
// can't reach into Vercel Blob — this explicit pass deletes those files
// first so a package delete doesn't leave orphaned blobs behind.
export async function deletePackageDocuments(packageId: number): Promise<void> {
  const docs = await getDocumentsByPackageId(packageId);
  if (docs.length === 0) return;
  await Promise.all(docs.map((doc) => deleteDocumentFile(doc.url)));
  // Row cleanup is left to ON DELETE CASCADE when the package itself is
  // deleted right after this call — no separate DB delete needed here.
}
