import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// macOS 지니 효과처럼, 누른 위치에서 쭈왁 늘어나며 열리고 그 자리로 빨려 들어가며 닫히는 패널.

const openStack: (() => void)[] = [];

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") openStack[openStack.length - 1]?.();
});

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface GenieProps {
  origin: DOMRect | null;
  label: string;
  /** 겹쳐 열리는 패널일수록 큰 값 */
  layer?: number;
  className?: string;
  onClosed: () => void;
  children: (close: () => void) => ReactNode;
}

export function Genie({ origin, label, layer = 0, className = "", onClosed, children }: GenieProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const frames = useCallback((): Keyframe[] => {
    const panel = panelRef.current;
    if (!panel) return [];
    const r = panel.getBoundingClientRect();
    const ox = origin ? origin.left + origin.width / 2 : window.innerWidth / 2;
    const oy = origin ? origin.top + origin.height / 2 : window.innerHeight / 2;
    const dx = ox - (r.left + r.width / 2);
    const dy = oy - (r.top + r.height / 2);
    const skew = Math.max(-14, Math.min(14, -dx / 40));
    return [
      { offset: 0, opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.03, 0.05)` },
      { offset: 0.35, opacity: 1, transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) scale(0.18, 0.8) skewX(${skew}deg)` },
      { offset: 0.75, opacity: 1, transform: "translate(0, 0) scale(1.03, 0.98)" },
      { offset: 1, opacity: 1, transform: "none" },
    ];
  }, [origin]);

  useLayoutEffect(() => {
    panelRef.current?.animate(frames(), {
      duration: reducedMotion() ? 1 : 560,
      easing: "cubic-bezier(.2,.9,.25,1)",
    });
  }, [frames]);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    const reversed = frames()
      .reverse()
      .map((f) => ({ ...f, offset: 1 - (f.offset ?? 0) }));
    const anim = panelRef.current?.animate(reversed, {
      duration: reducedMotion() ? 1 : 420,
      easing: "cubic-bezier(.55,0,.85,.35)",
      fill: "forwards",
    });
    if (anim) anim.onfinish = onClosed;
    else onClosed();
  }, [closing, frames, onClosed]);

  useEffect(() => {
    openStack.push(close);
    return () => {
      const i = openStack.indexOf(close);
      if (i >= 0) openStack.splice(i, 1);
    };
  }, [close]);

  return createPortal(
    <div
      className={`genie-backdrop ${closing ? "is-closing" : ""}`}
      style={{ zIndex: 100 + layer * 10 }}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div ref={panelRef} className={`genie-panel ${className}`} role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className="genie-close" onClick={close} aria-label="닫기">
          ×
        </button>
        {children(close)}
      </div>
    </div>,
    document.body,
  );
}
