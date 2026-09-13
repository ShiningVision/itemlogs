import { NextRequest, NextResponse } from 'next/server';
import { uploadImageFile } from '../../../lib/storage/images';
import { createImage, getImages } from '../../../lib/services/images';
import { MAX_UPLOAD_BYTES } from '../../../lib/storage/upload-limits';

// offset/limit are optional and back-compatible: called with neither (as
// before), this returns every image unfiltered. The ImagePickerModal passes
// both to page through images instead of loading the entire library at once.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offsetParam = searchParams.get('offset');
    const limitParam = searchParams.get('limit');
    const offset = offsetParam !== null ? Math.max(0, parseInt(offsetParam, 10) || 0) : undefined;
    const limit = limitParam !== null ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 60)) : undefined;

    const { images, totalCount } = await getImages({ offset, limit });

    if (offset !== undefined && limit !== undefined) {
      return NextResponse.json({ data: images, hasMore: offset + images.length < totalCount });
    }
    return NextResponse.json({ data: images });
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // The client already checks this (see GalleryGrid.tsx) so a well-behaved
    // upload never hits it, but this is the real guard — a request bigger
    // than MAX_UPLOAD_BYTES would otherwise just fail with Vercel's own
    // opaque 413 before this handler even runs on some paths, so checking
    // explicitly here gives a clean, translatable error code instead.
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'fileTooLarge', maxBytes: MAX_UPLOAD_BYTES }, { status: 413 });
    }

    // Note: file is expected to already be compressed client-side before it gets here
    const url = await uploadImageFile(file);
    const image = await createImage(url);

    return NextResponse.json({ data: image }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}