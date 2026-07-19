// app/api/v1/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createCategorySchema } from '../../../lib/validation/categories';
import { createCategory, getCategories } from '../../../lib/services/categories';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const category = await createCategory(parsed.data);
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}