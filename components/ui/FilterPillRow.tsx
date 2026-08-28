// components/ui/FilterPillRow.tsx
'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { FilterPill } from './FilterPill';

export type PillOption = { id: number; label: string };

// Caps a FilterPill row at `rowLimit` visual rows (2 by default). When the
// full list doesn't fit, a "more" tag (same FilterPill component, different
// color — see FilterPill's 'more' variant) takes the last visible slot in
// place of whichever real pills would've overflowed.
//
// A pill's wrapped position only ever depends on the pills before it in a
// flex-wrap row — never on what comes after — so a hidden probe rendering
// the *full* pill list can tell us exactly where each real pill lands, and
// that stays valid even once we go on to render a shorter, truncated list
// ending in the "more" tag instead. The probe also measures the "more"
// tag's own width once, so the cutoff calculation can check real available
// space on the last allowed row rather than guessing.
export function FilterPillRow({
  pills,
  selectedIds,
  onToggle,
  moreLabel,
  onMore,
  rowLimit = 2,
}: {
  pills: PillOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  moreLabel: string;
  onMore: () => void;
  rowLimit?: number;
}) {
  const probeRef = useRef<HTMLDivElement>(null);
  const moreProbeRef = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState(pills.length);

  useLayoutEffect(() => {
    const probe = probeRef.current;
    const moreProbe = moreProbeRef.current;
    if (!probe || !moreProbe) return;

    function measure() {
      const children = Array.from(probe!.children) as HTMLElement[];
      if (children.length === 0) {
        setVisibleCount(0);
        return;
      }

      const tops = children.map((el) => el.offsetTop);
      const uniqueTops = Array.from(new Set(tops));
      if (uniqueTops.length <= rowLimit) {
        setVisibleCount(pills.length);
        return;
      }

      const lastAllowedTop = uniqueTops[rowLimit - 1];
      const containerWidth = probe!.clientWidth;
      const moreWidth = moreProbe!.offsetWidth;
      const gap = parseFloat(getComputedStyle(probe!).columnGap || getComputedStyle(probe!).gap || '0') || 0;

      let count = 0;
      for (let i = 0; i < children.length; i++) {
        const top = tops[i];
        if (top < lastAllowedTop) {
          count++;
          continue;
        }
        if (top > lastAllowedTop) break;
        // On the last allowed row, only keep this pill if there's still
        // room left over for the "more" tag right after it.
        const el = children[i];
        const rightEdge = el.offsetLeft + el.offsetWidth;
        if (rightEdge + gap + moreWidth <= containerWidth) {
          count++;
        } else {
          break;
        }
      }
      setVisibleCount(count);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(probe);
    return () => ro.disconnect();
    // Re-measure on selection change too — a selected pill renders bold,
    // which is wider than the same label unselected, and can shift where
    // things wrap.
  }, [pills, selectedIds, rowLimit]);

  const hasOverflow = visibleCount < pills.length;
  const shown = pills.slice(0, visibleCount);

  return (
    <div style={{ position: 'relative' }}>
      {/* Hidden measuring pass — see the component-level comment. Absolutely
          positioned so it never affects visible layout, and hidden from
          assistive tech since it's not real content. */}
      <div
        ref={probeRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--spacing-xs)',
        }}
      >
        {pills.map((pill) => (
          <FilterPill
            key={pill.id}
            label={pill.label}
            selected={selectedIds.includes(pill.id)}
            onClick={() => {}}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, visibility: 'hidden', pointerEvents: 'none' }}
      >
        <FilterPill ref={moreProbeRef} label={moreLabel} selected={false} variant="more" onClick={() => {}} />
      </div>

      <div className="filter-pill-row">
        {shown.map((pill) => (
          <FilterPill
            key={pill.id}
            label={pill.label}
            selected={selectedIds.includes(pill.id)}
            onClick={() => onToggle(pill.id)}
          />
        ))}
        {hasOverflow && (
          <FilterPill label={moreLabel} selected={false} variant="more" onClick={onMore} />
        )}
      </div>
    </div>
  );
}
