// app/api/v1/public-items/route.ts
// Backs the storefront's infinite scroll: returns the next batch of public
// items for the given filters + offset. Mirrors the filtering logic in
// app/page.tsx (the SSR'd first page) exactly, including re-deriving the
// shop's allowed statuses from settings server-side — never trust a client-
// supplied statuses list on its own, since a visitor could otherwise request
// a status the owner has hidden.
import { NextRequest, NextResponse } from 'next/server';
import { getPublicItems } from '../../../lib/services/items';
import { getSettings } from '../../../lib/services/settings';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories');
    const typesParam = searchParams.get('types');
    const statusesParam = searchParams.get('statuses');
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0);
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '24', 10) || 24));

    const settings = await getSettings();
    if (!settings.show) {
      return NextResponse.json({ error: 'Storefront unavailable' }, { status: 404 });
    }

    const statusFlags: Record<number, boolean> = {
      1: settings.show_status_1,
      2: settings.show_status_2,
      3: settings.show_status_3,
      4: settings.show_status_4,
    };
    const allowedStatuses = [1, 2, 3, 4].filter((s) => statusFlags[s]);

    const categoryIds = categoriesParam ? categoriesParam.split(',').map(Number) : undefined;
    const typeIds = typesParam ? typesParam.split(',').map(Number) : undefined;
    const statuses = statusesParam ? statusesParam.split(',').map(Number) : undefined;

    const { items, totalCount } = await getPublicItems(
      { categoryIds, typeIds, statuses, limit, offset },
      allowedStatuses
    );

    return NextResponse.json({ data: items, hasMore: offset + items.length < totalCount });
  } catch (error) {
    console.error('Failed to fetch public items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
