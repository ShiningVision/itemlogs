// app/api/v1/packages/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadDocumentFile } from '@/app/lib/storage/documents';
import { createDocument, getDocumentsByPackageId } from '@/app/lib/services/documents';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const documents = await getDocumentsByPackageId(Number(id));
    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error('Failed to fetch package documents:', error);
    return NextResponse.json({ error: 'Failed to fetch package documents' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Unlike images, documents aren't compressed client-side first — a PDF
    // receipt shouldn't be recompressed as if it were a photo.
    const url = await uploadDocumentFile(file);
    const document = await createDocument({
      package_id: Number(id),
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
