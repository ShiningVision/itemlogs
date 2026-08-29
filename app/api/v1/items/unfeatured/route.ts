import { NextResponse } from 'next/server';
import { getUnfeaturedItems } from '@/app/lib/services/items';

export async function GET() {
  try {
    const items = await getUnfeaturedItems();
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Failed to fetch unfeatured items:', error);
    return NextResponse.json({ error: 'Failed to fetch unfeatured items' }, { status: 500 });
  }
}
