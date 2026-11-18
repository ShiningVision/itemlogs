// components/items/ExportFilterContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';

// The sale edit page renders its export button (SaleForm) and its filtered
// item list (SaleItemsSection) as siblings, so the ids the list is currently
// narrowed to travel through here: SaleItemsSection reports them (null = no
// filter active), SaleForm reads them to export exactly what's showing.
type ExportFilterValue = {
  ids: number[] | null;
  setIds: (ids: number[] | null) => void;
};

const ExportFilterContext = createContext<ExportFilterValue>({ ids: null, setIds: () => {} });

export function ExportFilterProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<number[] | null>(null);
  return <ExportFilterContext.Provider value={{ ids, setIds }}>{children}</ExportFilterContext.Provider>;
}

export function useExportFilter() {
  return useContext(ExportFilterContext);
}

// "/api/v1/sales/3/export" or ".../export?ids=1,2" — `ids` present (even
// empty) means "only these items"; absent means everything.
export function exportHref(basePath: string, ids: number[] | null): string {
  return ids ? `${basePath}?ids=${ids.join(',')}` : basePath;
}
