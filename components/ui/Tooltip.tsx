// components/ui/Tooltip.tsx
'use client';

import { cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

// Shared speech-bubble hovertext, replacing the plain browser tooltip
// (native `title`) everywhere it was used.
//
// Rendered through a portal into document.body and positioned in fixed
// coordinates computed from the trigger's own bounding box, rather than
// nested inside the trigger and centered via `left: 50%`. That earlier
// approach broke for any trigger sitting near the edge of a narrow or
// left-aligned parent (e.g. the "Stay on this page" checkbox): centering
// the bubble on a small trigger near the left edge pushed the bubble
// partly off-screen. Computing position in JS lets us clamp the bubble
// to the viewport and shift the arrow to still point at the trigger's
// true center, and — as a bonus — the bubble is no longer clipped by any
// ancestor's overflow:hidden/auto, since it isn't a descendant of the
// trigger at all once painted.
//
// Placement (above vs. below the trigger) is also decided in JS rather
// than fixed, for the same reason: a button that's already near the top
// of the viewport (e.g. a toolbar button right under the page header,
// like Import Excel on the items page) has a long tooltip that, rendered
// above by default, gets cut off by the browser chrome. show() renders
// an initial "above" guess, and a useLayoutEffect measures the bubble's
// actual (post-wrap) height right after it mounts — before the browser
// paints — and flips it below the trigger if it wouldn't fit above. The
// flip happens inside the same synchronous layout pass, so there's no
// visible flicker between the guess and the corrected position.
const BUBBLE_WIDTH = 260;
const VIEWPORT_MARGIN = 8;
const GAP = 10;

type TooltipPos = {
  top: number;
  left: number;
  arrowOffset: number;
  placement: 'above' | 'below';
  anchorTop: number;
  anchorBottom: number;
};

export function Tooltip({ text, children }: { text?: string; children: ReactElement }) {
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!pos) return;
    const hide = () => setPos(null);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [pos]);

  // Flip to below the trigger if the "above" guess would overflow the top
  // of the viewport. Only runs for the initial 'above' guess — once
  // flipped to 'below' we don't re-measure, since there's no equivalent
  // bottom-of-viewport bug report to guard against here.
  useLayoutEffect(() => {
    if (!pos || pos.placement !== 'above' || !bubbleRef.current) return;
    const height = bubbleRef.current.getBoundingClientRect().height;
    if (pos.anchorTop - height - GAP < VIEWPORT_MARGIN) {
      setPos({ ...pos, top: pos.anchorBottom + GAP, placement: 'below' });
    }
  }, [pos]);

  if (!text || !isValidElement(children)) return children;

  function show(el: HTMLElement | null) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const half = BUBBLE_WIDTH / 2;
    const clampedLeft = Math.min(
      Math.max(centerX, half + VIEWPORT_MARGIN),
      window.innerWidth - half - VIEWPORT_MARGIN
    );
    setPos({
      top: rect.top - GAP,
      left: clampedLeft,
      arrowOffset: centerX - clampedLeft,
      placement: 'above',
      anchorTop: rect.top,
      anchorBottom: rect.bottom,
    });
  }

  function hide() {
    setPos(null);
  }

  const trigger = cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      (children.props as { onMouseEnter?: (e: unknown) => void }).onMouseEnter?.(e);
      show(e.currentTarget);
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      (children.props as { onMouseLeave?: (e: unknown) => void }).onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      (children.props as { onFocus?: (e: unknown) => void }).onFocus?.(e);
      show(e.currentTarget);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      (children.props as { onBlur?: (e: unknown) => void }).onBlur?.(e);
      hide();
    },
  } as Record<string, unknown>);

  return (
    <>
      {trigger}
      {pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            ref={bubbleRef}
            className={`tooltip-bubble-portal${pos.placement === 'below' ? ' tooltip-bubble-portal--below' : ''}`}
            role="tooltip"
            style={
              {
                top: pos.top,
                left: pos.left,
                '--tooltip-arrow-offset': `${pos.arrowOffset}px`,
              } as React.CSSProperties
            }
          >
            {text}
          </span>,
          document.body
        )}
    </>
  );
}
