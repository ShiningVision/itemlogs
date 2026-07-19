import { NextResponse } from 'next/server';
import { getAvailableItems } from '@/app/lib/services/items';

export async function GET() {
  try {
    const items = await getAvailableItems();
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Failed to fetch available items:', error);
    return NextResponse.json({ error: 'Failed to fetch available items' }, { status: 500 });
  }
}