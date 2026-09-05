// app/api/v1/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, deleteDocument, assignDocumentToPackage } from '@/app/lib/services/documents';

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

// Attaches an already-uploaded, package-less document to a package (see
// DocumentPickerModal) — the only field this ever changes is package_id,
// and only ever from NULL to a real package (see assignDocumentToPackage's
// comment for why moving an already-attached document isn't something this
// supports).
export async function PATCH(
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

  const packageId = (body as { package_id?: unknown } | null)?.package_id;
  if (typeof packageId !== 'number' || !Number.isInteger(packageId)) {
    return NextResponse.json({ error: 'package_id is required.' }, { status: 400 });
  }

  try {
    const document = await assignDocumentToPackage(Number(id), packageId);
    return NextResponse.json({ data: document });
  } catch (error) {
    console.error('Failed to attach document to package:', error);
    return NextResponse.json({ error: 'Failed to attach document.' }, { status: 500 });
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
