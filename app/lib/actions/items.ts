// app/lib/actions/items.ts
'use server';

import { revalidatePath } from 'next/cache';

// Called from ItemForm right after a successful save, before navigating back.
//
// Why a server action: revalidatePath() called from inside a Server Action
// also clears the browser-side Router Cache (what Next shows instantly when
// you go back/forward). The item API routes can't do that, and
// router.refresh() didn't reliably do it for a back-navigation either — so
// the list the person returned to kept showing the item's old state until a
// hard reload. Revalidating the root layout covers every page an item edit
// can be opened from (items list, package, sale) and the visitor pages.
export async function revalidateAfterItemSaveAction() {
  revalidatePath('/', 'layout');
}
