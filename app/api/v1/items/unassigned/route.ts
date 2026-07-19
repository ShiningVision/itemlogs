import { NextResponse } from 'next/server';
import { getUnassignedItems } from '@/app/lib/services/items';

export async function GET() {
  try {
    const items = await getUnassignedItems();
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Failed to fetch unassigned items:', error);
    return NextResponse.json({ error: 'Failed to fetch unassigned items' }, { status: 500 });
  }
}