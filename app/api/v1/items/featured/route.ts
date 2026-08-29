import { NextResponse } from 'next/server';
import { getFeaturedItems } from '@/app/lib/services/items';

export async function GET() {
  try {
    const items = await getFeaturedItems();
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Failed to fetch featured items:', error);
    return NextResponse.json({ error: 'Failed to fetch featured items' }, { status: 500 });
  }
}
