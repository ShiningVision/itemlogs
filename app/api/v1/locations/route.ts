// app/api/v1/locations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createLocationSchema } from '../../../lib/validation/locations';
import { createLocation, getLocations } from '../../../lib/services/locations';

export async function GET() {
  try {
    const locations = await getLocations();
    return NextResponse.json({ data: locations });
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const location = await createLocation(parsed.data);
    return NextResponse.json({ data: location }, { status: 201 });
  } catch (error) {
    console.error('Failed to create location:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}
