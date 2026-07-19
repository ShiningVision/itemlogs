import { NextRequest, NextResponse } from 'next/server';
import { createSaleSchema } from '../../../lib/validation/sales';
import { createSale, getSales } from '../../../lib/services/sales';

export async function GET() {
  try {
    const sales = await getSales();
    return NextResponse.json({ data: sales });
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSaleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const sale = await createSale(parsed.data);
    return NextResponse.json({ data: sale }, { status: 201 });
  } catch (error) {
    console.error('Failed to create sale:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}