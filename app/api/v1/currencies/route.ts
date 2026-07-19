// app/api/v1/currencies/route.ts
import { NextResponse } from 'next/server';
import { getCurrencies } from '../../../lib/services/currencies';

export async function GET() {
  try {
    const currencies = await getCurrencies();
    return NextResponse.json({ data: currencies });
  } catch (error) {
    console.error('Failed to fetch currencies:', error);
    return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 });
  }
}