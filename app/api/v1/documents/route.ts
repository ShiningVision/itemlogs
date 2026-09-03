// app/api/v1/documents/route.ts
// Cross-package document listing — used by the Gallery page's Documents
// view, mirroring GET /api/v1/images (no offset/limit here since, like
// images, the Gallery fetches the full set and sorts/filters client-side).
import { NextRequest, NextResponse } from 'next/server';
import { uploadDocumentFile } from '@/app/lib/storage/documents';
import { createDocument, getDocuments } from '@/app/lib/services/documents';

export async function GET() {
  try {
    const documents = await getDocuments();
    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// Uploads a document with no package attached — the Gallery's own upload
// button (Documents view), for files that don't belong to any specific
// package. Mirrors POST /api/v1/packages/[id]/documents, minus the package
// scoping: package_id is left NULL rather than set from a route param.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const url = await uploadDocumentFile(file);
    const document = await createDocument({
      package_id: null,
      url,
      filename: file.name,
      content_type: file.type || null,
    });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
