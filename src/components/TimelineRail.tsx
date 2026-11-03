import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { fmtRange } from '../lib/dates';
import type { BlockView } from './BlockCard';

interface Props {
  views: BlockView[];
  activeIndex: number;
  /** smooth = animated scroll (tap/keys), false = instant (while dragging) */
  onSelect: (index: number, smooth: boolean) => void;
}

/**
 * A tall vertical "slider" that shows every block as a small square.
 * Drag the thumb (or anywhere on the track) to scrub through the timeline;
 * tap a square to jump to it.
 */
export function TimelineRail({ views, activeIndex, onSelect }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const sqRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [dragging, setDragging] = useState(false);
  const [thumbY, setThumbY] = useState(0);
  const lastIdx = useRef(activeIndex);

  const n = views.length;
  const idx = Math.max(0, Math.min(n - 1, activeIndex));

  // Position the thumb over the active square (and re-measure on resize).
  useLayoutEffect(() => {
    const place = () => {
      const sq = sqRefs.current[idx];
      if (sq) setThumbY(sq.offsetTop + sq.offsetHeight / 2 - 22);
    };
    place();
    const ro = new ResizeObserver(place);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [idx, n]);

  const indexAt = (clientY: number) => {
    let best = 0;
    let bestDist = Infinity;
    sqRefs.current.forEach((sq, i) => {
      if (!sq) return;
      const r = sq.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - clientY);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  };

  const select = (i: number, smooth: boolean) => {
    if (i === lastIdx.current && !smooth) return;
    lastIdx.current = i;
    onSelect(i, smooth);
  };

  // A press becomes a drag once the pointer moves a few pixels; otherwise it's a tap.
  const press = useRef<{ id: number; y: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    trackRef.current?.setPointerCapture(e.pointerId);
    press.current = { id: e.pointerId, y: e.clientY };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!press.current) return;
    if (!dragging) {
      if (Math.abs(e.clientY - press.current.y) < 6) return;
      setDragging(true);
      lastIdx.current = -1;
    }
    select(indexAt(e.clientY), false);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!press.current) return;
    trackRef.current?.releasePointerCapture(e.pointerId);
    if (!dragging && e.type === 'pointerup') select(indexAt(e.clientY), true);
    press.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
      PageDown: 3,
      PageUp: -3,
    };
    let next: number | null = null;
    if (e.key in step) next = idx + step[e.key];
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === null) return;
    e.preventDefault();
    select(Math.max(0, Math.min(n - 1, next)), true);
  };

  if (!n) return <div className="rail" />;
  const active = views[idx];
  const open = views.filter((v) => !v.assignment).length;

  return (
    <nav className="rail" aria-label="Timeline navigator">
      <span className="rail-cap" aria-hidden>
        Start
      </span>
      <div
        ref={trackRef}
        className={`rail-track ${dragging ? 'dragging' : ''}`}
        role="slider"
        tabIndex={0}
        aria-orientation="vertical"
        aria-valuemin={1}
        aria-valuemax={n}
        aria-valuenow={idx + 1}
        aria-valuetext={`Block ${idx + 1} of ${n}: ${fmtRange(active.block.start, active.block.end)}, ${
          active.assignment ? `covered by ${active.assignment.person}` : 'open'
        }. ${open} open in total.`}
        aria-label="Scroll through care blocks"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {views.map((v, i) => (
          <span
            key={v.block.start}
            ref={(el) => {
              sqRefs.current[i] = el;
            }}
            aria-hidden
            title={fmtRange(v.block.start, v.block.end)}
            className={`rail-sq ${v.assignment ? 'assigned' : ''} ${v.isPast ? 'past' : ''}`}
          >
            {v.conflicts.length > 0 && <span className="dot" />}
            {v.isToday && <span className="today-tick" />}
          </span>
        ))}
        <div className="rail-thumb" style={{ transform: `translateY(${thumbY}px)` }}>
          {dragging && <span className="rail-label">{fmtRange(active.block.start, active.block.end)}</span>}
        </div>
      </div>
      <span className="rail-cap" aria-hidden>
        End
      </span>
    </nav>
  );
}
