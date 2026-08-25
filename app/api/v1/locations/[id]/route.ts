// app/api/v1/locations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateLocationSchema } from '../../../../lib/validation/locations';
import { getLocationById, updateLocation, deleteLocation } from '../../../../lib/services/locations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const location = await getLocationById(Number(id));
    return NextResponse.json({ data: location });
  } catch (error) {
    console.error('Failed to fetch location:', error);
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const location = await updateLocation(Number(id), parsed.data);
    return NextResponse.json({ data: location });
  } catch (error) {
    console.error('Failed to update location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deleteLocation(Number(id));
    return NextResponse.json({ data: { id: Number(id), deleted: true } });
  } catch (error) {
    console.error('Failed to delete location:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
