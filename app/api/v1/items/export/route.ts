// app/api/v1/items/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getItems } from '@/app/lib/services/items';
import { buildItemsWorkbook } from '@/app/lib/items/exportItems';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories');
    const statusesParam = searchParams.get('statuses');
    const typeParam = searchParams.get('type');

    // Same filters the Items page's filter bar writes into the URL — but no
    // limit/offset, so every matching row is exported regardless of which
    // page of the (paginated) grid the user is currently looking at.
    const categoryIds = categoriesParam ? categoriesParam.split(',').map(Number) : undefined;
    const statuses = statusesParam ? statusesParam.split(',').map(Number) : undefined;
    const typeId = typeParam ? Number(typeParam) : undefined;

    const { items } = await getItems({ categoryIds, statuses, typeId });
    const buffer = await buildItemsWorkbook(items);

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
