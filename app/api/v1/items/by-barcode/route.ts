// app/api/v1/items/by-barcode/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAvailableItemByBarcode } from '@/app/lib/services/items';

// GET /api/v1/items/by-barcode?code=<barcode> — used by the scan-to-sell
// flow to resolve a scanned barcode to an available item id. Only ever
// matches status=1 (available) items; see getAvailableItemByBarcode.
export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('code')?.trim();
  if (!barcode) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  try {
    const item = await getAvailableItemByBarcode(barcode);
    if (!item) {
      return NextResponse.json({ error: 'No matching available item.' }, { status: 404 });
    }
    return NextResponse.json({ data: item });
  } catch (error) {
    console.error('Failed to look up item by barcode:', error);
    return NextResponse.json({ error: 'Failed to look up item by barcode' }, { status: 500 });
  }
}
