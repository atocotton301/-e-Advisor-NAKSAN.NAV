// 휴학·졸업 시기 계산
// 출처: 한성대 홈페이지 「휴ㆍ복학」(hansung/6248), 「졸업」(hansung/6234), 2026-2 학업이수가이드.
// - 일반휴학(가사·어학연수·질병·사고 등): 재학 중 통산 3년(6학기), 1회 1~2학기. 군휴학 기간은 제외.
// - 질병휴학은 일반휴학에 포함되며 종합병원 진단서(1개월 이상 치료)가 필요.
// - 신입생은 병역·질병이 아니면 입학년도에 휴학할 수 없다.
// - 특별휴학: 군입대(복무기간), 모성보호·창업(1회 1년, 통산 2년).
// - 학위수여: 매년 2월(전기)·8월(후기).

export type LeaveKind = "일반" | "질병" | "군입대" | "모성보호" | "창업";

export const LEAVE_KINDS: { kind: LeaveKind; note: string; maxEach: number }[] = [
  { kind: "일반", note: "개인 사정·어학연수 등. 질병휴학과 합쳐 통산 6학기", maxEach: 2 },
  { kind: "질병", note: "일반휴학에 포함. 종합병원 진단서(1개월 이상 치료) 필요", maxEach: 2 },
  { kind: "군입대", note: "입영 30일 전부터 신청. 통산 휴학 한도에서 제외", maxEach: 6 },
  { kind: "모성보호", note: "임신·출산·육아. 1회 2학기, 통산 4학기", maxEach: 2 },
  { kind: "창업", note: "창업휴학 승인 필요. 1회 2학기, 통산 4학기", maxEach: 2 },
];

export interface Leave {
  id: string;
  kind: LeaveKind;
  /** 몇 번째 재학 학기 앞에 휴학하는지 (0 = 1-1 전, 2 = 1-2를 마친 뒤) */
  before: number;
  semesters: number;
}

export interface CalendarSemester {
  year: number;
  term: 1 | 2;
  /** 재학이면 0~7 (1-1 ~ 4-2) */
  study?: number;
  leave?: LeaveKind;
}

export const STUDY_LABELS = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

export function buildCalendar(entryYear: number, leaves: Leave[], studySemesters = 8): CalendarSemester[] {
  const out: CalendarSemester[] = [];
  let year = entryYear;
  let term: 1 | 2 = 1;
  const push = (s: Omit<CalendarSemester, "year" | "term">) => {
    out.push({ year, term, ...s });
    if (term === 2) year += 1;
    term = term === 1 ? 2 : 1;
  };
  for (let k = 0; k < studySemesters; k++) {
    for (const l of leaves.filter((x) => x.before === k)) for (let n = 0; n < l.semesters; n++) push({ leave: l.kind });
    push({ study: k });
  }
  return out;
}

export interface GraduationDate {
  year: number;
  month: 2 | 8;
  /** 전기(2월, 동계) · 후기(8월, 하계) */
  label: string;
}

export function graduationOf(cal: CalendarSemester[]): GraduationDate {
  const last = cal[cal.length - 1]!;
  return last.term === 1
    ? { year: last.year, month: 8, label: `${last.year}년 8월 후기(하계) 졸업` }
    : { year: last.year + 1, month: 2, label: `${last.year + 1}년 2월 전기(동계) 졸업` };
}

export function leaveWarnings(entryYear: number, leaves: Leave[]): string[] {
  const w: string[] = [];
  const total = (kinds: LeaveKind[]) => leaves.filter((l) => kinds.includes(l.kind)).reduce((a, l) => a + l.semesters, 0);
  const general = total(["일반", "질병"]);
  if (general > 6) w.push(`일반·질병휴학이 통산 ${general}학기예요. 최대 6학기(3년)까지 가능해요.`);
  for (const k of ["모성보호", "창업"] as const) if (total([k]) > 4) w.push(`${k}휴학은 통산 4학기(2년)를 넘을 수 없어요.`);
  for (const l of leaves) {
    const max = LEAVE_KINDS.find((x) => x.kind === l.kind)!.maxEach;
    if (l.semesters > max) w.push(`${l.kind}휴학은 한 번에 ${max}학기까지 신청할 수 있어요. 나눠서 연장 신청해야 해요.`);
  }
  // 입학년도(1-1 전, 1-2 전) 일반·창업·모성보호 휴학은 불가
  const cal = buildCalendar(entryYear, leaves);
  if (cal.some((c) => c.year === entryYear && (c.leave === "일반" || c.leave === "창업" || c.leave === "모성보호")))
    w.push("신입생은 병역·질병이 아니면 입학한 해에 휴학할 수 없어요.");
  return w;
}
