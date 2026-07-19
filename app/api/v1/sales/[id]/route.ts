import { NextRequest, NextResponse } from 'next/server';
import { updateSaleSchema } from '../../../../lib/validation/sales';
import { getSaleById, updateSale, deleteSale } from '../../../../lib/services/sales';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const sale = await getSaleById(Number(id));
    return NextResponse.json({ data: sale });
  } catch (error) {
    console.error('Failed to fetch sale:', error);
    return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSaleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const sale = await updateSale(Number(id), parsed.data);
    return NextResponse.json({ data: sale });
  } catch (error) {
    console.error('Failed to update sale:', error);
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deleteSale(Number(id));
    return NextResponse.json({ data: { id: Number(id), deleted: true } });
  } catch (error) {
    console.error('Failed to delete sale:', error);
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}