// app/api/types/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateTypeSchema } from '../../../../lib/validation/types';
import { getTypeById, updateType, deleteType } from '../../../../lib/services/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const type = await getTypeById(Number(id));
    return NextResponse.json({ data: type });
  } catch (error) {
    console.error('Failed to fetch type:', error);
    return NextResponse.json({ error: 'Type not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const type = await updateType(Number(id), parsed.data);
    return NextResponse.json({ data: type });
  } catch (error) {
    console.error('Failed to update type:', error);
    return NextResponse.json({ error: 'Failed to update type' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deleteType(Number(id));
    return NextResponse.json({ data: { id: Number(id), deleted: true } });
  } catch (error) {
    console.error('Failed to delete type:', error);
    return NextResponse.json({ error: 'Failed to delete type' }, { status: 500 });
  }
}