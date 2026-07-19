// app/api/v1/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateCategorySchema } from '../../../..//lib/validation/categories';
import { getCategoryById, updateCategory, deleteCategory } from '../../../../lib/services/categories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const category = await getCategoryById(Number(id));
    return NextResponse.json({ data: category });
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const category = await updateCategory(Number(id), parsed.data);
    return NextResponse.json({ data: category });
  } catch (error) {
    console.error('Failed to update category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deleteCategory(Number(id));
    return NextResponse.json({ data: { id: Number(id), deleted: true } });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}