// app/api/v1/documents/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { deleteDocuments } from '@/app/lib/services/documents';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isFinite) : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No ids provided' }, { status: 400 });
    }

    await deleteDocuments(ids);
    return NextResponse.json({ data: { ids, deleted: true } });
  } catch (error) {
    console.error('Failed to bulk delete documents:', error);
    return NextResponse.json({ error: 'Failed to delete documents' }, { status: 500 });
  }
}
