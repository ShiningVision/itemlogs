// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createItemSchema } from '../../../lib/validation/items';
import { createItem, getItems } from '../../../lib/services/items';

// Query params are all optional and back-compatible: called with none of
// them (as some existing callers do), this behaves exactly as before —
// every item, unfiltered. Passing categories/statuses/type + offset/limit
// is what the dashboard items page's infinite scroll uses to fetch the next
// batch honoring the same filters as the current (server-rendered) view.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories');
    const statusesParam = searchParams.get('statuses');
    const typeParam = searchParams.get('type');
    const offsetParam = searchParams.get('offset');
    const limitParam = searchParams.get('limit');

    const categoryIds = categoriesParam ? categoriesParam.split(',').map(Number) : undefined;
    const statuses = statusesParam ? statusesParam.split(',').map(Number) : undefined;
    const typeId = typeParam ? Number(typeParam) : undefined;
    const offset = offsetParam !== null ? Math.max(0, parseInt(offsetParam, 10) || 0) : undefined;
    const limit = limitParam !== null ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 24)) : undefined;

    const { items, totalCount } = await getItems({ categoryIds, statuses, typeId, offset, limit });

    if (offset !== undefined && limit !== undefined) {
      return NextResponse.json({ data: items, hasMore: offset + items.length < totalCount });
    }
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