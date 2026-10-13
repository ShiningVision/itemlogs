// app/lib/hooks/useBeforeUnloadWhile.ts
'use client';

import { useEffect } from 'react';

// While `active` (e.g. an upload is in flight), asks the browser to confirm
// before the tab is closed or reloaded, since leaving would cut the upload
// off. Desktop browsers show their native "leave site?" prompt; phone
// browsers ignore beforeunload entirely, so pair this with a visible
// on-screen warning rather than relying on it alone.
export function useBeforeUnloadWhile(active: boolean) {
  useEffect(() => {
    if (!active) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [active]);
}
