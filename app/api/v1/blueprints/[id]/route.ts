import { NextRequest, NextResponse } from 'next/server';
import { updateBlueprintSchema } from '../../../../lib/validation/blueprints';
import { getBlueprintById, updateBlueprint, deleteBlueprint, DuplicateBarcodeError } from '../../../../lib/services/blueprints';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const blueprint = await getBlueprintById(Number(id));
    return NextResponse.json({ data: blueprint });
  } catch (error) {
    console.error('Failed to fetch blueprint:', error);
    return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateBlueprintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const blueprint = await updateBlueprint(Number(id), parsed.data);
    return NextResponse.json({ data: blueprint });
  } catch (error) {
    if (error instanceof DuplicateBarcodeError) {
      return NextResponse.json({ error: 'duplicateBarcode' }, { status: 409 });
    }
    console.error('Failed to update blueprint:', error);
    return NextResponse.json({ error: 'Failed to update blueprint' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deleteBlueprint(Number(id));
    return NextResponse.json({ data: { id: Number(id), deleted: true } });
  } catch (error) {
    console.error('Failed to delete blueprint:', error);
    return NextResponse.json({ error: 'Failed to delete blueprint' }, { status: 500 });
  }
}