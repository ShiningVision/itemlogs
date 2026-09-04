import { NextRequest, NextResponse } from 'next/server';
import { addSaleItemSchema } from '../../../../../lib/validation/sales-items';
import { getSaleItems, addSaleItem } from '../../../../../lib/services/sales-items';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const saleItems = await getSaleItems(Number(id));
    return NextResponse.json({ data: saleItems });
  } catch (error) {
    console.error('Failed to fetch sale items:', error);
    return NextResponse.json({ error: 'Failed to fetch sale items' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = addSaleItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const saleItem = await addSaleItem(Number(id), parsed.data.item_id, parsed.data.sell_price);
    return NextResponse.json({ data: saleItem }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add item to sale:', error);

    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Item already in this sale' }, { status: 409 });
    }
    if (error?.code === '23503') {
      return NextResponse.json({ error: 'Invalid sale or item reference' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to add item to sale' }, { status: 500 });
  }
}