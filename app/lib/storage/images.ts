import { put, del } from '@vercel/blob';

export async function uploadImageFile(file: File) {
  const blob = await put(`items/${crypto.randomUUID()}-${file.name}`, file, {
    access: 'public',
  });

  return blob.url;
}

// Used when we fetch an image from an external URL ourselves (e.g. Excel
// import) rather than receiving a browser File — no filename/content-type
// to infer, so both are passed in explicitly.
export async function uploadImageBuffer(buffer: Buffer, filename: string, contentType: string) {
  const blob = await put(`items/${crypto.randomUUID()}-${filename}`, buffer, {
    access: 'public',
    contentType,
  });

  return blob.url;
}

export async function deleteImageFile(url: string) {
  await del(url);
}