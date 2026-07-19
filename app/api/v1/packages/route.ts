// app/api/packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPackageSchema } from '../../../lib/validation/packages';
import { createPackage, getPackages } from '../../../lib/services/packages';

export async function GET() {
  try {
    const packages = await getPackages();
    return NextResponse.json({ data: packages });
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPackageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const pkg = await createPackage(parsed.data);
    return NextResponse.json({ data: pkg }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create package:', error);

    if (error?.code === '23503') {
      return NextResponse.json(
        { error: 'Invalid currency reference' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
}