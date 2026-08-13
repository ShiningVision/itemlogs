import { NextRequest, NextResponse } from 'next/server';
import { getBlueprintByBarcode } from '@/app/lib/services/blueprints';

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('code')?.trim();
  if (!barcode) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  try {
    const blueprint = await getBlueprintByBarcode(barcode);
    if (!blueprint) {
      return NextResponse.json({ error: 'No matching blueprint.' }, { status: 404 });
    }
    return NextResponse.json({ data: blueprint });
  } catch (error) {
    console.error('Failed to look up blueprint by barcode:', error);
    return NextResponse.json({ error: 'Failed to look up blueprint by barcode' }, { status: 500 });
  }
}
