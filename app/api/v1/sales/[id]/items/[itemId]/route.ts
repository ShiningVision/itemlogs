import { NextRequest, NextResponse } from 'next/server';
import { removeSaleItem } from '../../../../../../lib/services/sales-items';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;

  try {
    await removeSaleItem(Number(id), Number(itemId));
    return NextResponse.json({ data: { removed: true } });
  } catch (error) {
    console.error('Failed to remove item from sale:', error);
    return NextResponse.json({ error: 'Failed to remove item from sale' }, { status: 500 });
  }
}