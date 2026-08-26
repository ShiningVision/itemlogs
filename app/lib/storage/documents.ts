// app/lib/storage/documents.ts
// Blob upload/delete helpers for package documents — mirrors
// app/lib/storage/images.ts, but under a distinct `documents/` prefix (item
// images live under `items/`) so Gallery's usage bar can split "images
// usage" from "documents usage" by pathname prefix alone (see
// app/lib/storage/blob-usage.ts), without needing a separate DB column or
// query to tell the two apart.
import { put, del } from '@vercel/blob';

export async function uploadDocumentFile(file: File) {
  const blob = await put(`documents/${crypto.randomUUID()}-${file.name}`, file, {
    access: 'public',
  });

  return blob.url;
}

export async function deleteDocumentFile(url: string) {
  await del(url);
}
