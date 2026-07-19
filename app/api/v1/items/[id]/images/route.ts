// app/api/items/[id]/images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addItemImageSchema } from '../../../../../lib/validation/item-images';
import { getItemImages, addItemImage } from '../../../../../lib/services/item-images';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const itemImages = await getItemImages(Number(id));
    return NextResponse.json({ data: itemImages });
  } catch (error) {
    console.error('Failed to fetch item images:', error);
    return NextResponse.json({ error: 'Failed to fetch item images' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = addItemImageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const itemImage = await addItemImage(Number(id), parsed.data.image_id);
    return NextResponse.json({ data: itemImage }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add image to item:', error);

    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Image already attached to this item' }, { status: 409 });
    }
    if (error?.code === '23503') {
      return NextResponse.json({ error: 'Invalid item or image reference' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to add image to item' }, { status: 500 });
  }
}