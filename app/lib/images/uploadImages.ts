// app/lib/images/uploadImages.ts
//
// Client-side helper behind every "upload image(s)" button (the Gallery page
// and the image picker used by the item form). Uploads one file at a time —
// each is its own request on purpose: the server enforces a per-request body
// limit (see MAX_UPLOAD_BYTES), so batching several files into one request
// would blow past it. Sequential rather than parallel keeps memory and
// bandwidth sane on a phone when someone picks dozens of photos.
//
// Every file is compressed first and the size limit is checked AFTER
// compression (a big original usually compresses well under the limit), same
// as the single-file flow always did.

import { compressImageFile } from '@/app/lib/images/compressImage';
import { MAX_UPLOAD_BYTES } from '@/app/lib/storage/upload-limits';

export type UploadedImage = { id: number; url: string };

export type UploadImagesResult = {
  uploaded: UploadedImage[];
  tooLarge: number;
  failed: number;
};

export async function uploadImageFiles(
  files: File[],
  // Called as each image finishes, so the UI can show it right away instead
  // of waiting for the whole batch.
  onUploaded?: (image: UploadedImage) => void | Promise<void>,
  // Called after each file is finished (whether it succeeded or not) with
  // how many have been processed so far, for an "n of total" indicator.
  onProgress?: (done: number, total: number) => void
): Promise<UploadImagesResult> {
  const result: UploadImagesResult = { uploaded: [], tooLarge: 0, failed: 0 };
  let done = 0;
  onProgress?.(0, files.length);

  for (const file of files) {
    try {
      const compressed = await compressImageFile(file);
      if (compressed.size > MAX_UPLOAD_BYTES) {
        result.tooLarge++;
        continue;
      }

      const formData = new FormData();
      formData.append('file', compressed);
      const res = await fetch('/api/v1/images', { method: 'POST', body: formData });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.data) {
        result.uploaded.push(json.data);
        await onUploaded?.(json.data);
      } else if (json?.error === 'fileTooLarge') {
        result.tooLarge++;
      } else {
        result.failed++;
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      result.failed++;
    } finally {
      // In `finally` so the early `continue` above (too large) still counts
      // the file as processed.
      done++;
      onProgress?.(done, files.length);
    }
  }

  return result;
}
