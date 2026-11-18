// app/api/v1/sales/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSaleById } from '@/app/lib/services/sales';
import { getSaleItems } from '@/app/lib/services/sales-items';
import { getSettings } from '@/app/lib/services/settings';
import { buildItemsWorkbook, buildExportFilename } from '@/app/lib/items/exportItems';
import { parseIdList } from '@/app/lib/idList';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const saleId = Number(id);

    const [sale, saleItems, settings] = await Promise.all([
      getSaleById(saleId),
      getSaleItems(saleId),
      getSettings(),
    ]);

    // `ids` (when present, even empty) narrows the export to the items the
    // page's filter is currently showing — only ever a subset of this
    // sale's own items, never anything outside it.
    const idsParam = new URL(request.url).searchParams.get('ids');
    const wanted = idsParam === null ? null : new Set(parseIdList(idsParam));
    const allItems = saleItems.map((si) => si.items);
    const exportItems = wanted ? allItems.filter((item: any) => wanted.has(item.id)) : allItems;

    const buffer = await buildItemsWorkbook(exportItems, settings);
    const filename = buildExportFilename(sale.date, sale.name);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export sale items:', error);
    return NextResponse.json({ error: 'Failed to export sale items' }, { status: 500 });
  }
}
