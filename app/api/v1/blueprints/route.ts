import { NextRequest, NextResponse } from 'next/server';
import { createBlueprintSchema } from '../../../lib/validation/blueprints';
import { createBlueprint, getBlueprints, DuplicateBarcodeError } from '../../../lib/services/blueprints';

export async function GET() {
  try {
    const blueprints = await getBlueprints();
    return NextResponse.json({ data: blueprints });
  } catch (error) {
    console.error('Failed to fetch blueprints:', error);
    return NextResponse.json({ error: 'Failed to fetch blueprints' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBlueprintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const blueprint = await createBlueprint(parsed.data);
    return NextResponse.json({ data: blueprint }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateBarcodeError) {
      return NextResponse.json({ error: 'duplicateBarcode' }, { status: 409 });
    }
    console.error('Failed to create blueprint:', error);
    return NextResponse.json({ error: 'Failed to create blueprint' }, { status: 500 });
  }
}