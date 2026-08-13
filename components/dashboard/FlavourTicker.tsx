// components/dashboard/FlavourTicker.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

// Pixels per second while auto-scrolling. Replaces the old fixed-duration
// CSS animation (90s per full loop) now that position is driven from a
// requestAnimationFrame loop instead — needed so we can pause on hover and
// let pointer drags take over the same position value.
const PIXELS_PER_SECOND = 40;

// News-anchor style "lower third" ticker for the dashboard flavour text —
// every line joins into one strip (bullet-separated) and scrolls
// continuously right-to-left. Auto-scroll pauses on hover, and the strip
// can be dragged left/right with mouse or touch.
//
// The strip is rendered twice back-to-back inside a flex track. `position`
// (the track's translateX, in px) is kept wrapped into (-singleWidth, 0] —
// singleWidth being one copy's width — so at any position the two copies
// together always cover the visible window seamlessly, whether we're
// auto-scrolling or the user has dragged partway through a loop.
export function FlavourTicker({ texts }: { texts: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const singleWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPositionRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const speed = reducedMotion ? 0 : PIXELS_PER_SECOND;

    const measure = () => {
      singleWidthRef.current = track.scrollWidth / 2;
    };
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);

    let raf: number;
    let last = performance.now();

    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      const singleWidth = singleWidthRef.current;
      if (!pausedRef.current && !draggingRef.current && singleWidth > 0) {
        let next = positionRef.current - speed * dt;
        if (next <= -singleWidth) next += singleWidth;
        positionRef.current = next;
      }
      if (track) track.style.transform = `translateX(${positionRef.current}px)`;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, []);

  function wrap(value: number) {
    const singleWidth = singleWidthRef.current;
    if (singleWidth <= 0) return value;
    return (((value % singleWidth) + singleWidth) % singleWidth) - singleWidth;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartPositionRef.current = positionRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const delta = e.clientX - dragStartXRef.current;
    positionRef.current = wrap(dragStartPositionRef.current + delta);
  }

  function endDrag() {
    draggingRef.current = false;
    setIsDragging(false);
  }

  if (texts.length === 0) return null;

  const strip = texts.join(' • ');

  return (
    <div
      className="flavour-ticker"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div
        ref={trackRef}
        className={`flavour-ticker-track${isDragging ? ' flavour-ticker-track-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
      >
        <span className="flavour-ticker-item">{strip}</span>
        <span className="flavour-ticker-item" aria-hidden="true">
          {strip}
        </span>
      </div>
    </div>
  );
}
