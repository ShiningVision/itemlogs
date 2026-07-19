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
    return NextResponse.json({ error: 'Failed to distribute fees' }, { status: 500 });
  }
}