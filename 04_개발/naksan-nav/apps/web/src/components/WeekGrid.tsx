import { useLayoutEffect, useMemo, useRef, type CSSProperties, type MutableRefObject } from "react";
import { clashesWith, convert, DAYS, overlaps, toMin, type TimetableEntry } from "../lib/timetable";

/** 방금 누른 과목 카드·분반 버튼 자리. 새로 들어온 칸이 여기서 날아와 시간표에 꽂힌다. */
export interface Launch {
  name: string;
  rect: DOMRect;
  at: number;
}

interface WeekGridProps {
  entries: TimetableEntry[];
  /** 마우스를 올린 과목: 그 과목 칸을 강조한다 */
  focus?: string | null;
  /** 담기 전에 미리 보는 칸 (점선) */
  ghost?: TimetableEntry[];
  launch?: MutableRefObject<Launch | null>;
}

const DAY_START = 9 * 60;
/** 저녁 수업이 없으면 18시까지만 그린다 */
const MIN_END = 18 * 60;
const FLIGHT_MS = 560;
const STAGGER_MS = 110;
/** 누른 뒤 이 시간 안에 들어온 칸만 날아온다 */
const LAUNCH_TTL_MS = 1000;
const TONES = 8;

const spanOf = (e: TimetableEntry) => {
  const t = convert(e.day, e.from, e.to);
  return t ? { start: toMin(t.start), end: toMin(t.end), label: `${t.start}–${t.end}` } : null;
};

const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
};

/** 과목마다 다른 색. 먼저 들어온 과목의 색은 뒤에 과목이 더 들어와도 바뀌지 않는다. */
function tonesOf(names: string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const name of names) {
    if (out.has(name)) continue;
    const used = new Set(out.values());
    let tone = hash(name) % TONES;
    for (let k = 0; k < TONES && used.has(tone); k++) tone = (tone + 1) % TONES;
    out.set(name, tone);
  }
  return out;
}

/** 시간이 겹치는 칸은 덮어쓰지 않고 나란히 놓는다: 칸마다 몇 번째 줄(lane)인지와 그 묶음의 줄 수 */
function lanesOf(items: { id: string; start: number; end: number }[]): Map<string, { lane: number; lanes: number }> {
  const out = new Map<string, { lane: number; lanes: number }>();
  let group: { id: string; lane: number }[] = [];
  let groupEnd = -1;
  const laneEnds: number[] = [];
  const close = () => {
    const lanes = laneEnds.length || 1;
    for (const g of group) out.set(g.id, { lane: g.lane, lanes });
    group = [];
    laneEnds.length = 0;
  };
  for (const it of [...items].sort((a, b) => a.start - b.start || a.end - b.end)) {
    if (it.start >= groupEnd) close();
    let lane = laneEnds.findIndex((end) => end <= it.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = it.end;
    group.push({ id: it.id, lane });
    groupEnd = Math.max(groupEnd, it.end);
  }
  close();
  return out;
}

/** 과목 이름표가 누른 자리에서 포물선을 그리며 날아가 시간표 칸에 쏙 들어간다. */
function fly(from: DOMRect, to: { x: number; y: number }, label: string, tone: number, delay: number) {
  const sx = from.left + from.width / 2;
  const sy = from.top + from.height / 2;
  const dx = to.x - sx;
  const dy = to.y - sy;
  const lift = Math.min(140, 50 + Math.abs(dx) * 0.2);

  const flyer = document.createElement("div");
  flyer.className = "wk-flyer";
  flyer.style.left = `${sx}px`;
  flyer.style.top = `${sy}px`;
  const chip = document.createElement("span");
  chip.className = `wk-flyer__chip wk-tone-${tone}`;
  chip.textContent = label;
  flyer.appendChild(chip);
  document.body.appendChild(flyer);

  const timing = { duration: FLIGHT_MS, delay, fill: "both" as const };
  // 가로는 고르게, 세로는 위로 떴다가 떨어지게 따로 움직여 포물선을 만든다.
  flyer.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], { ...timing, easing: "cubic-bezier(.3,0,.45,1)" });
  const drop = chip.animate(
    [
      { transform: "translate(-50%, -50%) scale(.7)", opacity: 0, easing: "cubic-bezier(.2,.75,.4,1)" },
      { transform: `translate(-50%, calc(-50% - ${lift}px)) scale(1)`, opacity: 1, offset: 0.38, easing: "cubic-bezier(.6,0,.85,.5)" },
      { transform: `translate(-50%, calc(-50% + ${dy}px)) scale(.4)`, opacity: 1 },
    ],
    timing,
  );
  const done = () => flyer.remove();
  drop.onfinish = done;
  drop.oncancel = done;
}

/** 한 주 시간표. 과목마다 색을 달리하고, 시간이 겹치면 빨간 빗금으로 보여준다. */
export function WeekGrid({ entries, focus = null, ghost = [], launch }: WeekGridProps) {
  const blocks = useRef(new Map<string, HTMLDivElement>());
  const shown = useRef<Set<string> | null>(null);
  const tones = useMemo(() => tonesOf(entries.map((e) => e.name)), [entries]);
  const clashes = useMemo(() => overlaps(entries), [entries]);
  // 칸마다 시각과 줄 위치. 겹친 칸은 같은 요일 안에서 나란히 선다.
  const placed = useMemo(() => {
    const out = new Map<string, NonNullable<ReturnType<typeof spanOf>> & { lane: number; lanes: number }>();
    for (const d of DAYS) {
      const items = entries.flatMap((e) => {
        const s = e.day === d ? spanOf(e) : null;
        return s ? [{ id: e.id, ...s }] : [];
      });
      const lanes = lanesOf(items);
      for (const it of items) out.set(it.id, { ...it, ...lanes.get(it.id)! });
    }
    return out;
  }, [entries]);

  const latest = Math.max(MIN_END, ...[...entries, ...ghost].map((e) => spanOf(e)?.end ?? 0));
  const total = Math.ceil(latest / 60) * 60 - DAY_START;
  const at = (min: number) => `${((min - DAY_START) / total) * 100}%`;
  const len = (min: number) => `${(min / total) * 100}%`;
  const hours = Array.from({ length: total / 60 }, (_, i) => DAY_START + i * 60);

  // 새로 들어온 칸: 학기를 처음 열 때는 차례로 살짝, 과목을 담을 때는 누른 자리에서 날아와 쏙.
  useLayoutEffect(() => {
    const before = shown.current;
    shown.current = new Set(entries.map((e) => e.id));
    const fresh = before ? entries.filter((e) => !before.has(e.id)) : entries;
    const from = launch?.current;
    const flying =
      !!before && !!from && performance.now() - from.at < LAUNCH_TTL_MS && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fresh.forEach((e, k) => {
      const el = blocks.current.get(e.id);
      if (!el) return;
      if (!before) return el.style.setProperty("--pop-delay", `${k * 30}ms`);
      // offset 값은 튀어나오는 애니메이션(transform)의 영향을 받지 않아 도착 지점이 정확하다.
      const col = el.parentElement!.getBoundingClientRect();
      const target = { x: col.left + el.offsetLeft + el.offsetWidth / 2, y: col.top + el.offsetTop + el.offsetHeight / 2 };
      if (flying && from.name === e.name && target.y > 0 && target.y < window.innerHeight) {
        el.style.setProperty("--pop-delay", `${FLIGHT_MS - 90 + k * STAGGER_MS}ms`);
        fly(from.rect, target, e.name, tones.get(e.name) ?? 0, k * STAGGER_MS);
      } else {
        el.style.setProperty("--pop-delay", `${k * STAGGER_MS}ms`);
      }
    });
  }, [entries, launch, tones]);

  const summary = entries
    .map((e) => `${e.name} ${e.day} ${spanOf(e)?.label ?? ""}`)
    .join(", ");

  return (
    <div className="wk" role="img" aria-label={summary ? `시간표: ${summary}` : "빈 시간표"} style={{ "--hours": total / 60 } as CSSProperties}>
      <div className="wk__head">
        <span />
        {DAYS.map((d) => (
          <b key={d}>{d}</b>
        ))}
      </div>
      <div className="wk__body">
        <div className="wk__times">
          {hours.map((m) => (
            <span key={m} style={{ top: at(m) }}>
              {m / 60}
            </span>
          ))}
        </div>
        {DAYS.map((d) => (
          <div key={d} className="wk__col">
            {hours.slice(1).map((m) => (
              <i key={m} style={{ top: at(m) }} />
            ))}
            {entries
              .filter((e) => e.day === d)
              .map((e) => {
                const p = placed.get(e.id);
                if (!p) return null;
                return (
                  <div
                    key={e.id}
                    ref={(el) => {
                      if (el) blocks.current.set(e.id, el);
                      else blocks.current.delete(e.id);
                    }}
                    className={`wk__block wk-tone-${tones.get(e.name) ?? 0}${clashes.has(e.id) ? " is-clash" : ""}${focus === e.name ? " is-focus" : ""}`}
                    style={{
                      top: at(p.start),
                      height: len(p.end - p.start),
                      left: `calc(${(p.lane / p.lanes) * 100}% + 2px)`,
                      width: `calc(${100 / p.lanes}% - 4px)`,
                    }}
                    title={`${e.name} · ${e.day} ${p.label}${e.room ? ` · ${e.room}` : ""}`}
                  >
                    <b>{e.name}</b>
                    {e.room && <small>{e.room}</small>}
                  </div>
                );
              })}
            {ghost
              .filter((g) => g.day === d)
              .map((g) => {
                const s = spanOf(g);
                if (!s) return null;
                const clash = clashesWith([g], entries.filter((e) => e.name !== g.name)).length > 0;
                return (
                  <div
                    key={g.id}
                    className={`wk__block is-ghost${clash ? " is-clash" : ""}`}
                    style={{ top: at(s.start), height: len(s.end - s.start) }}
                  >
                    <b>{clash ? "겹침" : g.name}</b>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
