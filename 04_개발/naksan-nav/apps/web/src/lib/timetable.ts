// 한성대 강의시간 환산 (수강신청 안내서 「강의시간 안내」 기준)
// 시간표는 50분 단위 교시(1, 1M, 2, 2M …)로 표기하지만
// 월·수·목은 75분 수업이라 한 수업이 교시 1.5칸을 차지한다.

export const DAYS = ["월", "화", "수", "목", "금"] as const;
export type Day = (typeof DAYS)[number];

/** 1, 1M, 2, 2M … 14, 14M 순서의 교시 코드 */
export const SLOT_CODES = Array.from({ length: 14 }, (_, i) => [`${i + 1}`, `${i + 1}M`]).flat();

interface Block {
  slots: string[];
  start: string;
  end: string;
}

// 월·수·목 (75분, 주간 휴식 15분 · 야간 10분)
const MWT: Block[] = [
  { slots: ["1", "1M", "2"], start: "09:00", end: "10:15" },
  { slots: ["2M", "3", "3M"], start: "10:30", end: "11:45" },
  { slots: ["4", "4M", "5"], start: "12:00", end: "13:15" },
  { slots: ["5M", "6", "6M"], start: "13:30", end: "14:45" },
  { slots: ["7", "7M", "8"], start: "15:00", end: "16:15" },
  { slots: ["8M", "9", "9M"], start: "16:30", end: "17:45" },
  { slots: ["10", "10M", "11"], start: "18:00", end: "19:15" },
  { slots: ["11M", "12", "12M"], start: "19:25", end: "20:40" },
  { slots: ["13", "13M", "14"], start: "20:45", end: "22:00" },
];

// 화·금 (50분, 주간 휴식 10분 · 야간 5분)
const TF_TIMES: [string, string][] = [
  ["09:00", "09:50"],
  ["10:00", "10:50"],
  ["11:00", "11:50"],
  ["12:00", "12:50"],
  ["13:00", "13:50"],
  ["14:00", "14:50"],
  ["15:00", "15:50"],
  ["16:00", "16:50"],
  ["17:00", "17:50"],
  ["18:00", "18:50"],
  ["18:55", "19:45"],
  ["19:50", "20:40"],
  ["20:45", "21:35"],
  ["21:40", "22:30"],
];
const TF: Block[] = TF_TIMES.map(([start, end], i) => ({ slots: [`${i + 1}`, `${i + 1}M`], start, end }));

const blocksFor = (day: Day) => (day === "화" || day === "금" ? TF : MWT);
const blockOf = (day: Day, slot: string) => blocksFor(day).find((b) => b.slots.includes(slot));

export const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export interface Converted {
  start: string;
  end: string;
}

/** 요일과 시작·끝 교시를 실제 시각으로 바꾼다. 범위가 맞지 않으면 null. */
export function convert(day: Day, from: string, to: string): Converted | null {
  const a = blockOf(day, from);
  const b = blockOf(day, to);
  if (!a || !b) return null;
  if (SLOT_CODES.indexOf(from) > SLOT_CODES.indexOf(to)) return null;
  return { start: a.start, end: b.end };
}

export interface TimetableEntry {
  id: string;
  name: string;
  day: Day;
  from: string;
  to: string;
  room?: string;
}

/**
 * "월2M~3M 수2M~3M", "화 3-4" 같은 시간표 표기를 읽는다.
 * 읽지 못한 조각은 errors 로 돌려준다.
 */
export function parseSlots(text: string): { items: { day: Day; from: string; to: string }[]; errors: string[] } {
  const items: { day: Day; from: string; to: string }[] = [];
  const errors: string[] = [];
  const re = /([월화수목금])\s*(\d{1,2}M?)\s*(?:[~\-–]\s*(\d{1,2}M?))?/g;
  let m: RegExpExecArray | null;
  let matched = "";
  while ((m = re.exec(text))) {
    matched += m[0];
    const day = m[1] as Day;
    const from = m[2]!.toUpperCase();
    const to = (m[3] ?? m[2])!.toUpperCase();
    if (!convert(day, from, to)) errors.push(m[0].trim());
    else items.push({ day, from, to });
  }
  if (!items.length && !errors.length && text.trim()) errors.push(text.trim());
  return { items, errors };
}

// ---------- 분반 → 시간표 ----------

/** 과목 분반. 종합정보시스템 분반은 몇 학기 개설인지(term)를 함께 갖고 있다. */
export interface SectionLike {
  sec: string;
  prof: string;
  /** 요일·교시 (예: 월2M~3M,수2M~3M). 온라인 강좌는 비어 있다. */
  time: string;
  room: string;
  term?: 1 | 2;
}

export const sectionsOf = (course: { sections?: { sec: string; prof: string; time: string; room: string }[] }) =>
  (course.sections ?? []) as SectionLike[];

/** 한 학기 분반만 보여줄 때는 "1학기 A" 의 학기 표시를 뗀다. */
export const secLabel = (s: SectionLike) => (s.term ? s.sec.replace(/^[12]학기 /, "") : s.sec);

/** 이번 학기(1·2학기)에 열리는 분반의 원래 인덱스. 학기 정보가 없는 분반이면 전부. */
export function sectionIndexesFor(sections: SectionLike[], term?: 1 | 2): number[] {
  const all = sections.map((_, i) => i);
  if (!term || !sections.some((s) => s.term)) return all;
  const inTerm = all.filter((i) => sections[i]!.term === term);
  return inTerm.length ? inTerm : all;
}

let seq = 0;
export const newEntryId = () => `tt-${Date.now().toString(36)}-${seq++}`;

const slotsOf = (time: string) => parseSlots(time.replace(/\//g, " ")).items;

/** 분반 시간을 시간표 칸으로 바꾼다. 읽을 수 없는(온라인) 분반은 빈 배열. */
export function sectionEntries(name: string, section: SectionLike): TimetableEntry[] {
  return slotsOf(section.time).map((it) => ({ id: newEntryId(), name, room: section.room || undefined, ...it }));
}

/** "월2M~3M,수2M~3M" → "월 10:30–11:45 · 수 10:30–11:45" */
export function describeSlots(time: string): string {
  return slotsOf(time)
    .map((it) => {
      const t = convert(it.day, it.from, it.to)!;
      return `${it.day} ${t.start}–${t.end}`;
    })
    .join(" · ");
}

const slotKey = (e: { day: string; from: string; to: string }) => `${e.day}${e.from}-${e.to}`;

/** 시간표에 이 과목이 들어간 분반 (칸이 모두 맞는 분반의 인덱스, 없으면 -1) */
export function placedSectionIndex(name: string, sections: SectionLike[], entries: TimetableEntry[]): number {
  const mine = entries.filter((e) => e.name === name);
  if (!mine.length) return -1;
  const placed = new Set(mine.map(slotKey));
  const room = mine[0]!.room;
  return sections.findIndex((s) => {
    const items = slotsOf(s.time);
    return items.length === placed.size && items.every((it) => placed.has(slotKey(it))) && (!room || room === s.room);
  });
}

/** 넣으려는 칸과 시간이 겹치는 다른 과목 이름 */
export function clashesWith(candidate: TimetableEntry[], others: TimetableEntry[]): string[] {
  const names = new Set<string>();
  for (const a of candidate) {
    const ta = convert(a.day, a.from, a.to);
    if (!ta) continue;
    for (const b of others) {
      const tb = b.day === a.day ? convert(b.day, b.from, b.to) : null;
      if (tb && toMin(ta.start) < toMin(tb.end) && toMin(tb.start) < toMin(ta.end)) names.add(b.name);
    }
  }
  return [...names];
}

/** 같은 요일에 시간이 겹치는 항목 id 쌍 */
export function overlaps(entries: TimetableEntry[]): Set<string> {
  const out = new Set<string>();
  const withTime = entries
    .map((e) => ({ e, t: convert(e.day, e.from, e.to) }))
    .filter((x): x is { e: TimetableEntry; t: Converted } => !!x.t);
  for (let i = 0; i < withTime.length; i++) {
    for (let j = i + 1; j < withTime.length; j++) {
      const a = withTime[i]!;
      const b = withTime[j]!;
      if (a.e.day !== b.e.day) continue;
      if (toMin(a.t.start) < toMin(b.t.end) && toMin(b.t.start) < toMin(a.t.end)) {
        out.add(a.e.id);
        out.add(b.e.id);
      }
    }
  }
  return out;
}
