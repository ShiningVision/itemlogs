// app/api/v1/packages/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPackageById } from '@/app/lib/services/packages';
import { getItemsByPackageId } from '@/app/lib/services/items';
import { getSettings } from '@/app/lib/services/settings';
import { buildItemsWorkbook, buildExportFilename } from '@/app/lib/items/exportItems';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const packageId = Number(id);

    const [pkg, items, settings] = await Promise.all([
      getPackageById(packageId),
      getItemsByPackageId(packageId),
      getSettings(),
    ]);

    const buffer = await buildItemsWorkbook(items, settings);
    // Packages don't have a single "date" field (they have separate
    // departure/arrival dates) — fall back to departure_date, then today,
    // to still get a sensibly-sorted filename like the sale export does.
    const filenameDate = pkg.departure_date ?? pkg.arrival_date ?? new Date().toISOString().slice(0, 10);
    const filename = buildExportFilename(filenameDate, pkg.name);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export package items:', error);
    return NextResponse.json({ error: 'Failed to export package items' }, { status: 500 });
  }
}
