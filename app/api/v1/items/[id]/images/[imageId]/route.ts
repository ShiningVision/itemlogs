// app/api/items/[id]/images/[imageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { removeItemImage } from '../../../../../../lib/services/item-images';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;

  try {
    await removeItemImage(Number(id), Number(imageId));
    return NextResponse.json({ data: { removed: true } });
  } catch (error) {
    console.error('Failed to remove image from item:', error);
    return NextResponse.json({ error: 'Failed to remove image from item' }, { status: 500 });
  }
}