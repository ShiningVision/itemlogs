// app/lib/storage/blob-usage.ts
// Vercel Blob has no single "total usage" API — the only way to know how much
// space is used is to page through list() and sum each blob's size. That's a
// rate-limited "advanced operation", so we cache the result in memory for a
// short TTL (mirroring the exchange-rates.ts pattern) instead of recomputing
// it on every Gallery page load.
import { list } from '@vercel/blob';

// Vercel Blob Hobby (free) plan limit.
export const BLOB_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB

type UsageSnapshot = {
  totalBytes: number;
  // Split out by Blob pathname prefix — `items/` (item images, see
  // app/lib/storage/images.ts) vs `documents/` (package documents, see
  // app/lib/storage/documents.ts). `otherBytes` catches anything under
  // neither prefix (there shouldn't be any today, but this keeps
  // imagesBytes + documentsBytes + otherBytes === totalBytes an invariant
  // rather than a silent undercount if a third prefix shows up later).
  imagesBytes: number;
  documentsBytes: number;
  otherBytes: number;
  sizeByUrl: Map<string, number>;
  fetchedAt: number;
};

let cache: UsageSnapshot | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchUsage(): Promise<UsageSnapshot> {
  const sizeByUrl = new Map<string, number>();
  let totalBytes = 0;
  let imagesBytes = 0;
  let documentsBytes = 0;
  let otherBytes = 0;
  let cursor: string | undefined;

  do {
    const page = await list({ cursor, limit: 1000 });
    for (const blob of page.blobs) {
      sizeByUrl.set(blob.url, blob.size);
      totalBytes += blob.size;
      if (blob.pathname.startsWith('items/')) imagesBytes += blob.size;
      else if (blob.pathname.startsWith('documents/')) documentsBytes += blob.size;
      else otherBytes += blob.size;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return { totalBytes, imagesBytes, documentsBytes, otherBytes, sizeByUrl, fetchedAt: Date.now() };
}

// Returns the total bytes used and a url -> size map for per-image display.
// Cached for CACHE_TTL_MS; pass `force: true` right after an upload/delete to
// get a fresh read instead of stale cached numbers.
export async function getBlobUsage(options: { force?: boolean } = {}) {
  if (!options.force && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }

  try {
    cache = await fetchUsage();
    return cache;
  } catch (error) {
    console.error('Failed to fetch Vercel Blob usage:', error);
    if (cache) return cache;
    // No cache to fall back on — report zero usage rather than crashing the
    // Gallery page over a storage-usage sidebar feature.
    return {
      totalBytes: 0,
      imagesBytes: 0,
      documentsBytes: 0,
      otherBytes: 0,
      sizeByUrl: new Map<string, number>(),
      fetchedAt: Date.now(),
    };
  }
}
