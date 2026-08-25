// app/dashboard/(protected)/types/page.tsx
//
// Retired — type management now happens via the "Manage" button on the
// dashboard items page (opens TagManagerModal in manage mode), alongside
// category and location. This standalone page/route is kept only as a
// redirect for any old bookmarks/links, rather than deleted outright.
import { redirect } from 'next/navigation';

export default function TypesPage() {
  redirect('/dashboard/items');
}
