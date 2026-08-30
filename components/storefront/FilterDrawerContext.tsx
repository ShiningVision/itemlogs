// components/storefront/FilterDrawerContext.tsx
'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

// Shared open/close state for the mobile filter drawer. The trigger (a
// hamburger icon) lives in StorefrontHeader; the actual sliding panel is
// rendered by FilterSidebar, further down the tree. Since they're siblings
// rather than parent/child, they need a common place to coordinate —
// this context, provided once at the top of the storefront page.
type FilterDrawerContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const FilterDrawerContext = createContext<FilterDrawerContextValue | null>(null);

export function FilterDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <FilterDrawerContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </FilterDrawerContext.Provider>
  );
}

export function useFilterDrawer() {
  const ctx = useContext(FilterDrawerContext);
  if (!ctx) {
    throw new Error('useFilterDrawer must be used within a FilterDrawerProvider');
  }
  return ctx;
}

// Non-throwing variant for components that render outside a
// FilterDrawerProvider on some pages but not others (see StorefrontHeader's
// hideMenuButton — the item detail page has no filter drawer to open at
// all). Calling useContext directly here (rather than reusing
// useFilterDrawer) keeps the hook call itself unconditional wherever it's
// used, since the null-check is just a plain value check, not a hook rule
// concern — callers just get `null` instead of a thrown error when there's
// no provider.
export function useFilterDrawerOptional() {
  return useContext(FilterDrawerContext);
}
