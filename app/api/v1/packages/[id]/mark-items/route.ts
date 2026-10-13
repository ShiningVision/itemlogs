// app/api/v1/packages/[id]/mark-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { setPackageItemsSoonOrAvailable } from '@/app/lib/services/packages';

// Body: { target: 'soon' | 'available' }. Marking 'soon' only changes the
// package's Available items; marking 'available' only changes its Soon
// items — everything else is left as it is (see
// setPackageItemsSoonOrAvailable).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const target = (body as { target?: string } | null)?.target;
  if (target !== 'soon' && target !== 'available') {
    return NextResponse.json({ error: 'target must be "soon" or "available".' }, { status: 400 });
  }

  try {
    const updated = await setPackageItemsSoonOrAvailable(Number(id), target);
    return NextResponse.json({ data: { updated, target } });
  } catch (error) {
    console.error('Failed to mark package items:', error);
    return NextResponse.json({ error: 'Failed to update items' }, { status: 500 });
  }
}
