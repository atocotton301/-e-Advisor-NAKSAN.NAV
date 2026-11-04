import { useCallback, useRef, type PointerEvent } from "react";

/** 마우스를 따라 살짝 기울어지는 카드. 마우스 기기에서만, 움직임 줄이기 설정이면 꺼진다. */
export function useTilt<T extends HTMLElement>(max = 6) {
  const ref = useRef<T>(null);
  const enabled =
    typeof window !== "undefined" &&
    window.matchMedia?.("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const onPointerMove = useCallback(
    (e: PointerEvent<T>) => {
      const el = ref.current;
      if (!el || !enabled) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
      el.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
      el.style.setProperty("--gx", `${px * 100}%`);
      el.style.setProperty("--gy", `${py * 100}%`);
      el.classList.add("is-tilting");
    },
    [enabled, max],
  );
  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.classList.remove("is-tilting");
  }, []);
  return { ref, onPointerMove, onPointerLeave };
}
