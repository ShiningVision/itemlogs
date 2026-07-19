// app/api/packages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updatePackageSchema } from '../../../../lib/validation/packages';
import { getPackageById, updatePackage, deletePackage } from '../../../../lib/services/packages';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const pkg = await getPackageById(Number(id));
    return NextResponse.json({ data: pkg });
  } catch (error) {
    console.error('Failed to fetch package:', error);
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updatePackageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const pkg = await updatePackage(Number(id), parsed.data);
    return NextResponse.json({ data: pkg });
  } catch (error: any) {
    console.error('Failed to update package:', error);

    if (error?.code === '23503') {
      return NextResponse.json(
        { error: 'Invalid currency reference' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deletePackage(Number(id));
    return NextResponse.json({ data: { id: Number(id), deleted: true } });
  } catch (error) {
    console.error('Failed to delete package:', error);
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
  }
}