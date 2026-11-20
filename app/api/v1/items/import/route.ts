// app/api/v1/items/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { importItemsFromExcel } from '@/app/lib/items/importItems';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importItemsFromExcel(buffer, { confirmDeletes: formData.get('confirmDeletes') === 'true' });

    if (!result.success) {
      if (result.needsDeleteConfirmation) {
        return NextResponse.json(
          { error: result.error, needsDeleteConfirmation: result.needsDeleteConfirmation },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to import items:', error);
    return NextResponse.json({ error: 'Failed to import items' }, { status: 500 });
  }
}
