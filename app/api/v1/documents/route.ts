// app/api/v1/documents/route.ts
// Cross-package document listing — used by the Gallery page's Documents
// view, mirroring GET /api/v1/images (no offset/limit here since, like
// images, the Gallery fetches the full set and sorts/filters client-side).
import { NextResponse } from 'next/server';
import { getDocuments } from '@/app/lib/services/documents';

export async function GET() {
  try {
    const documents = await getDocuments();
    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
