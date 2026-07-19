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
    const result = await importItemsFromExcel(buffer);

    if (!result.success) {
      return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to import items:', error);
    return NextResponse.json({ error: 'Failed to import items' }, { status: 500 });
  }
}
