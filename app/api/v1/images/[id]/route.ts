// app/api/images/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getImageById, deleteImage } from '../../../../lib/services/images';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const image = await getImageById(Number(id));
    return NextResponse.json({ data: image });
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deleteImage(Number(id));
    return NextResponse.json({ data: { id: Number(id), deleted: true } });
  } catch (error) {
    console.error('Failed to delete image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}