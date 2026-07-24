// app/lib/images/compressImage.ts
// Client-side image compression before upload, to conserve Vercel Blob storage
// (1 GB Hobby-plan budget). Tuned to be as aggressive as WhatsApp's image compression:
// long edge capped at 1280px, targeting ~300KB per image.
'use client';

import imageCompression from 'browser-image-compression';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1280,
  initialQuality: 0.7,
  useWebWorker: true,
};

export async function compressImageFile(file: File): Promise<File> {
  // Skip formats that don't benefit / can break re-encoding (e.g. already-tiny files, gifs).
  if (file.type === 'image/gif' || file.size <= COMPRESSION_OPTIONS.maxSizeMB * 1024 * 1024) {
    return file;
  }

  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    // browser-image-compression returns a Blob; re-wrap as a File to preserve the name.
    return new File([compressed], file.name, { type: compressed.type || file.type });
  } catch (error) {
    console.error('Image compression failed, uploading original file:', error);
    return file;
  }
}
