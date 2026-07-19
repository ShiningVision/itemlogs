// app/api/types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createTypeSchema } from '../../../lib/validation/types';
import { createType, getTypes } from '../../../lib/services/types';

export async function GET() {
  try {
    const types = await getTypes();
    return NextResponse.json({ data: types });
  } catch (error) {
    console.error('Failed to fetch types:', error);
    return NextResponse.json({ error: 'Failed to fetch types' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const type = await createType(parsed.data);
    return NextResponse.json({ data: type }, { status: 201 });
  } catch (error) {
    console.error('Failed to create type:', error);
    return NextResponse.json({ error: 'Failed to create type' }, { status: 500 });
  }
}