// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createItemSchema } from '../../../lib/validation/items';
import { createItem, getItems } from '../../../lib/services/items';

export async function GET() {
  try {
    const { items } = await getItems();
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const item = await createItem(parsed.data);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'FEATURED_CAP_REACHED') {
      return NextResponse.json({ error: 'featuredCapReached' }, { status: 400 });
    }
    console.error('Failed to create item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}