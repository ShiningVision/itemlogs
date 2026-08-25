// app/api/v1/sales/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSaleById } from '@/app/lib/services/sales';
import { getSaleItems } from '@/app/lib/services/sales-items';
import { getSettings } from '@/app/lib/services/settings';
import { buildItemsWorkbook, buildExportFilename } from '@/app/lib/items/exportItems';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const saleId = Number(id);

    const [sale, saleItems, settings] = await Promise.all([
      getSaleById(saleId),
      getSaleItems(saleId),
      getSettings(),
    ]);

    const buffer = await buildItemsWorkbook(saleItems.map((si) => si.items), settings);
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
