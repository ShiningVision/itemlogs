// app/api/languages/route.ts
import { NextResponse } from 'next/server';
import { getLanguages } from '../../../lib/services/languages';

export async function GET() {
  try {
    const languages = await getLanguages();
    return NextResponse.json({ data: languages });
  } catch (error) {
    console.error('Failed to fetch languages:', error);
    return NextResponse.json({ error: 'Failed to fetch languages' }, { status: 500 });
  }
}