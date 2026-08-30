// app/api/v1/items/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getItems } from '@/app/lib/services/items';
import { getSettings } from '@/app/lib/services/settings';
import { buildItemsWorkbook } from '@/app/lib/items/exportItems';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories');
    const statusesParam = searchParams.get('statuses');
    const typesParam = searchParams.get('types');
    const locationsParam = searchParams.get('locations');
    const searchParam = searchParams.get('search');

    // Same filters the Items page's filter bar writes into the URL — but no
    // limit/offset, so every matching row is exported regardless of which
    // page of the (paginated) grid the user is currently looking at.
    const categoryIds = categoriesParam ? categoriesParam.split(',').map(Number) : undefined;
    const statuses = statusesParam ? statusesParam.split(',').map(Number) : undefined;
    const typeIds = typesParam ? typesParam.split(',').map(Number) : undefined;
    const locationIds = locationsParam ? locationsParam.split(',').map(Number) : undefined;
    const search = searchParam || undefined;

    const [{ items }, settings] = await Promise.all([
      getItems({ categoryIds, statuses, typeIds, locationIds, search }),
      getSettings(),
    ]);
    const buffer = await buildItemsWorkbook(items, settings);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="items-export.xlsx"',
      },
    });
  } catch (error) {
    console.error('Failed to export items:', error);
    return NextResponse.json({ error: 'Failed to export items' }, { status: 500 });
  }
}
