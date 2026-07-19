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
