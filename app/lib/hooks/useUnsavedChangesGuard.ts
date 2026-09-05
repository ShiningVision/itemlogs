// app/lib/hooks/useUnsavedChangesGuard.ts
'use client';

import { useEffect, useRef } from 'react';

// Warns before the person actually leaves an Update page while it has
// unsaved edits — used by ItemForm/PackageForm/SaleForm's update mode.
//
// Two distinct kinds of "leaving" are handled:
//
// 1. Real browser navigation (refresh, closing the tab, typing a new URL,
//    or clicking any in-app link — including the sidebar nav, which
//    renders as <a> tags via next/link). A capturing click listener on
//    `document` catches every link click regardless of where in the tree
//    it's rendered, and `beforeunload` catches everything else (refresh,
//    close, typed URL, bookmarks).
//
// 2. Navigation triggered from this component's own code — e.g. the
//    "Back" button, which calls router.push()/router.back() directly
//    rather than rendering an <a> — isn't a real link click, so the
//    listener above can't see it. Call confirmNavigation() first and only
//    proceed if it returns true.
//
// What's deliberately NOT covered: the browser's own Back/Forward buttons
// (intercepting those reliably means pushing sentinel history entries,
// which has its own side effects) and non-anchor "leave" affordances this
// hook doesn't know about elsewhere in the app (e.g. logout). Those are
// edge cases weighed against not making history navigation janky everywhere.
export function useUnsavedChangesGuard(isDirty: boolean, message: string) {
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;
  const messageRef = useRef(message);
  messageRef.current = message;

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    }

    function handleClick(e: MouseEvent) {
      if (!dirtyRef.current || e.defaultPrevented) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      // Downloads (e.g. the "Export to Excel" links) and new-tab/modified
      // clicks don't navigate away from this page, so there's nothing to
      // guard.
      if (anchor.hasAttribute('download') || anchor.target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      if (!window.confirm(messageRef.current)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  function confirmNavigation(): boolean {
    return !dirtyRef.current || window.confirm(messageRef.current);
  }

  return { confirmNavigation };
}
