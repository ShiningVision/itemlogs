// app/api/v1/images/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { deleteImages } from '../../../../lib/services/images';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isFinite) : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No ids provided' }, { status: 400 });
    }

    await deleteImages(ids);
    return NextResponse.json({ data: { ids, deleted: true } });
  } catch (error) {
    console.error('Failed to bulk delete images:', error);
    return NextResponse.json({ error: 'Failed to delete images' }, { status: 500 });
  }
}
