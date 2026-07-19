import { NextRequest, NextResponse } from 'next/server';
import { uploadImageFile } from '../../../lib/storage/images';
import { createImage, getImages } from '../../../lib/services/images';

export async function GET() {
  try {
    const { images } = await getImages();
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

    // Note: file is expected to already be compressed client-side before it gets here
    const url = await uploadImageFile(file);
    const image = await createImage(url);

    return NextResponse.json({ data: image }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}