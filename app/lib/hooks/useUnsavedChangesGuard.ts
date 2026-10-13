// app/lib/hooks/useUnsavedChangesGuard.ts
'use client';

import { createElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Guards an Update page's unsaved edits — used by ItemForm/PackageForm/
// SaleForm's update mode. Leaving with edits shows a Save / Discard dialog
// (Save is the primary action; clicking outside the dialog just closes it and
// keeps you on the page). Three kinds of "leaving" are handled:
//
// 1. In-app link clicks (including the sidebar nav, which renders as <a> via
//    next/link). A capturing click listener on `document` catches every link
//    click wherever it's rendered, cancels it, shows the dialog, and
//    performs the navigation itself once the person picks Save or Discard.
//
// 2. Navigation triggered from the form's own code (e.g. its Back button) —
//    not a link click, so the listener can't see it. Wrap it:
//    requestLeave(() => router.back()).
//
// 3. The page going away: closing the tab/app, switching away on a phone.
//    Browsers allow no custom dialog there (and phones never show the native
//    beforeunload prompt at all), so instead the form's onBackgroundSave is
//    called as the page becomes hidden — a keepalive request that can finish
//    after the page is gone. It's best-effort: if the request is lost, the
//    edit is lost. The native beforeunload prompt is kept as a desktop
//    fallback.
//
// Deliberately NOT covered: the browser's own Back/Forward buttons
// (intercepting those reliably means pushing sentinel history entries).
//
// (No JSX in this file on purpose — it's a .ts, so the dialog is built with
// createElement.)
export function useUnsavedChangesGuard(
  isDirty: boolean,
  {
    onSave,
    onBackgroundSave,
  }: {
    // Saves in place WITHOUT navigating; resolves true only on success (on
    // failure the form shows its own error and the dialog just closes).
    onSave: () => Promise<boolean>;
    // Fire-and-forget save for when the page is being hidden/closed. Must
    // start its request synchronously (fetch with keepalive: true) and must
    // do nothing if there's nothing new to save.
    onBackgroundSave?: () => void;
  }
): { requestLeave: (proceed: () => void) => void; guardDialog: ReactNode } {
  const t = useTranslations('unsavedChanges');
  const router = useRouter();

  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const onBackgroundSaveRef = useRef(onBackgroundSave);
  onBackgroundSaveRef.current = onBackgroundSave;

  const [pendingProceed, setPendingProceed] = useState<(() => void) | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function requestLeave(proceed: () => void) {
    if (!dirtyRef.current) {
      proceed();
      return;
    }
    // Wrapped in an arrow so React stores the function instead of calling it
    // as a state updater.
    setPendingProceed(() => proceed);
  }

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    }

    function handleHidden() {
      if (!dirtyRef.current) return;
      onBackgroundSaveRef.current?.();
    }
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') handleHidden();
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

      e.preventDefault();
      e.stopImmediatePropagation();

      const url = new URL(anchor.href, window.location.href);
      const sameOrigin = url.origin === window.location.origin;
      setPendingProceed(() => () => {
        if (sameOrigin) router.push(url.pathname + url.search + url.hash);
        else window.location.assign(url.href);
      });
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    // visibilitychange covers phones (app switched away/closed); pagehide
    // covers desktop tab close and iOS Safari paths where visibilitychange
    // doesn't fire. The form's onBackgroundSave de-dupes repeat calls.
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleHidden);
    document.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleHidden);
      document.removeEventListener('click', handleClick, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    const proceed = pendingProceed;
    if (!proceed) return;
    setIsSaving(true);
    try {
      const ok = await onSaveRef.current();
      setPendingProceed(null);
      if (ok) {
        // Saved, so don't let a hard navigation (external link) trip the
        // native beforeunload prompt before the re-render marks it clean.
        dirtyRef.current = false;
        proceed();
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscard() {
    const proceed = pendingProceed;
    setPendingProceed(null);
    // A hard navigation the person just chose to discard shouldn't also hit
    // the native beforeunload prompt or trigger a background save.
    dirtyRef.current = false;
    proceed?.();
  }

  const guardDialog: ReactNode = pendingProceed
    ? createElement(ConfirmDialog, {
        message: t('message'),
        confirmLabel: isSaving ? t('saving') : t('save'),
        cancelLabel: t('discard'),
        onConfirm: handleSave,
        onCancel: handleDiscard,
        onDismiss: () => {
          if (!isSaving) setPendingProceed(null);
        },
        isConfirming: isSaving,
      })
    : null;

  return { requestLeave, guardDialog };
}
