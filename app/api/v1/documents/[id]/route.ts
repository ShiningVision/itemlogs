// app/api/v1/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, deleteDocument } from '@/app/lib/services/documents';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const document = await getDocumentById(Number(id));
    return NextResponse.json({ data: document });
  } catch (error) {
    console.error('Failed to fetch document:', error);
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deleteDocument(Number(id));
    return NextResponse.json({ data: { id: Number(id), deleted: true } });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
