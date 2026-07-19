// app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateItemSchema } from '../../../../lib/validation/items';
import { getItemById, updateItem, deleteItem } from '../../../../lib/services/items';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const item = await getItemById(Number(id));
    return NextResponse.json({ data: item });
  } catch (error) {
    console.error('Failed to fetch item:', error);
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const item = await updateItem(Number(id), parsed.data);
    return NextResponse.json({ data: item });
  } catch (error) {
    if (error instanceof Error && error.message === 'FEATURED_CAP_REACHED') {
      return NextResponse.json({ error: 'featuredCapReached' }, { status: 400 });
    }
    console.error('Failed to update item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deleteItem(Number(id));
    return NextResponse.json({ data: { id: Number(id), deleted: true } });
  } catch (error) {
    console.error('Failed to delete item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}