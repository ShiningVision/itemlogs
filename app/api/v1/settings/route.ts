// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateSettingsSchema } from '../../../lib/validation/settings';
import { getSettings, updateSettings } from '../../../lib/services/settings';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const settings = await updateSettings(parsed.data);
    return NextResponse.json({ data: settings });
  } catch (error: any) {
    console.error('Failed to update settings:', error);

    if (error?.code === '23503') {
      return NextResponse.json(
        { error: 'Invalid currency or language reference' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}