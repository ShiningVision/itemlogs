// app/api/v1/packages/[id]/distribute-fees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { distributePackageFees } from '@/app/lib/services/packages';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await distributePackageFees(Number(id));
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to distribute fees:', error);
    // The service throws plain Errors with user-meaningful messages for
    // expected problems (package has no items, total purchase price is
    // zero) — pass those through so the UI can say what's wrong.
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to distribute fees' }, { status: 500 });
  }
}