// app/dashboard/(protected)/categories/page.tsx
//
// Retired — category management now happens via the "Manage" button on the
// dashboard items page (opens TagManagerModal in manage mode), alongside
// type and location. This standalone page/route is kept only as a redirect
// for any old bookmarks/links, rather than deleted outright.
import { redirect } from 'next/navigation';

export default function CategoriesPage() {
  redirect('/dashboard/items');
}
