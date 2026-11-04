import type { Course } from "../types";

// 학번별 졸업요건. 2026-2 「수강신청 안내 및 학업이수가이드」와 「개인별 교육과정 이수 현황 조회」 화면 기준.
// 실제 서비스에서는 backend CHECK 엔진이 학번별 요건 버전을 내려준다.

export interface RequirementSpec {
  version: string;
  totalCredits: number;
  extraPoints: number;
  baseCreditsPerSemester: number;
  maxCreditsPerSemester: number;
  major: { basic: number; required: number; total: number };
  liberalBasic: { group: string; label: string; need: number }[];
  liberalAreas: string[];
  liberalAreaMin: number;
  liberalAreaCredits: { min: number; max: number };
  /** 아직 조사 중이라 근사치로 계산하는 버전 */
  note?: string;
}

const AREAS = ["예술과 스포츠", "인문학적 상상력", "사회과학적 상상력", "과학기술 상상력", "융합적 상상력"];

const SPEC_19_23: RequirementSpec = {
  version: "19~23학번",
  totalCredits: 130,
  extraPoints: 800,
  baseCreditsPerSemester: 18,
  maxCreditsPerSemester: 21,
  major: { basic: 3, required: 15, total: 39 },
  liberalBasic: [
    { group: "사고와표현", label: "사고와표현", need: 2 },
    { group: "코딩", label: "코딩 첫걸음 / AI와 SW기초", need: 2 },
    { group: "영어독해작문", label: "영어 독해/작문", need: 2 },
    { group: "영어청취회화", label: "영어 청취/회화", need: 2 },
  ],
  liberalAreas: AREAS,
  liberalAreaMin: 3,
  liberalAreaCredits: { min: 7, max: 9 },
};

const SPEC_24: RequirementSpec = {
  ...SPEC_19_23,
  version: "24학번 이후",
  liberalBasic: [
    { group: "사고와표현", label: "사고와 표현", need: 3 },
    { group: "영어독해작문", label: "영어커뮤니케이션 독해·작문", need: 2 },
    { group: "영어청취회화", label: "영어커뮤니케이션 청취·회화", need: 2 },
    { group: "코딩", label: "AI와 SW기초", need: 3 },
    { group: "이마기난스", label: "한성 이마기난스", need: 3 },
  ],
  liberalAreaMin: 4,
  liberalAreaCredits: { min: 15, max: 15 },
};

const SPEC_16_18: RequirementSpec = {
  ...SPEC_19_23,
  version: "16~18학번",
  note: "16~18학번 교양 세부 요건은 조사 중이에요. 지금은 19~23학번 교양 구조로 계산해요.",
};

const SPEC_15: RequirementSpec = {
  ...SPEC_19_23,
  version: "15학번 이전",
  totalCredits: 140,
  extraPoints: 0,
  maxCreditsPerSemester: 20,
  note: "15학번 이전은 졸업 140학점, 비교과 요건 없음. 교양·전공 세부 요건은 조사 중이에요.",
};

export function specFor(entryYear: number): RequirementSpec {
  const yy = entryYear % 100;
  if (yy <= 15) return SPEC_15;
  if (yy <= 18) return SPEC_16_18;
  if (yy <= 23) return SPEC_19_23;
  return SPEC_24;
}

/** 학번 앞 두 자리 → 입학년도 */
export const entryYearOf = (studentId: string) => 2000 + Number(studentId.slice(0, 2));

/** 지금 로그인한 학생에게 적용 중인 요건. 로그인할 때 학번으로 바꾼다. */
export const REQ: RequirementSpec = { ...SPEC_19_23 };

export function applyRequirementVersion(entryYear: number, admission?: import("../types").Admission) {
  REQ.note = undefined;
  Object.assign(REQ, structuredClone(specFor(entryYear)));
  if (!admission) return;
  // 편입생 졸업요건 (한성대 졸업 안내 · 학업이수가이드)
  // 일반편입: 본교 4학기 이상 등록, 인정+취득 130학점, 비교과 2학년 편입 600pt · 3학년 편입 400pt
  // 학사편입: 본교 4학기 이상 등록, 취득 65학점(+인정), 비교과 400pt, 교양 이수 의무 없음 (2개 트랙 각 39학점)
  if (admission.kind === "일반편입") {
    REQ.extraPoints = admission.transferGrade === 2 ? 600 : 400;
    REQ.note = `${admission.transferGrade ?? 3}학년 일반편입 기준이에요. 편입 전 인정학점은 학과 학점인정 결과에 따라 달라요.`;
  }
  if (admission.kind === "학사편입") {
    REQ.extraPoints = 400;
    REQ.liberalBasic = [];
    REQ.liberalAreaMin = 0;
    REQ.liberalAreaCredits = { ...REQ.liberalAreaCredits, min: 0 };
    REQ.note = "학사편입 기준: 본교에서 65학점 이상 취득, 교양 이수 의무 없음, 2개 트랙 각 39학점, 비교과 400pt.";
  }
  if (admission.kind === "미래플러스") {
    REQ.note = "미래플러스대학(성인학습자) 기준: 130학점·800pt에 학과별 졸업작품·논문 요건이 더해져요. 교양은 대학 자체 개설 과목으로 이수해요.";
  }
}

export interface Progress {
  have: number;
  need: number;
}

export interface TrackProgress {
  basic: Progress;
  required: Progress;
  total: Progress;
}

export interface RequirementStatus {
  liberalBasic: (Progress & { label: string })[];
  liberalBasicTotal: Progress;
  areas: { name: string; credits: number }[];
  areaCount: Progress;
  areaCredits: Progress;
  track1: TrackProgress;
  track2: TrackProgress | null;
  majorTotal: Progress;
  totalCredits: Progress;
  extraPoints: Progress;
}

export const isMet = (p: Progress) => p.have >= p.need;

const sum = (courses: Course[]) => courses.reduce((acc, c) => acc + c.credits, 0);

function trackProgress(courses: Course[], slot: 1 | 2): TrackProgress {
  const mine = courses.filter((c) => c.trackSlot === slot);
  return {
    basic: { have: sum(mine.filter((c) => c.category === "전공기초")), need: REQ.major.basic },
    required: { have: sum(mine.filter((c) => c.category === "전공필수")), need: REQ.major.required },
    total: { have: sum(mine), need: REQ.major.total },
  };
}

export function evaluate(courses: Course[], points: number, hasTrack2: boolean): RequirementStatus {
  const liberalBasic = REQ.liberalBasic.map((r) => ({
    label: r.label,
    have: sum(courses.filter((c) => c.category === "필수교양" && c.group === r.group)),
    need: r.need,
  }));
  const areas = REQ.liberalAreas.map((name) => ({
    name,
    credits: sum(courses.filter((c) => c.category === "선택필수교양" && c.group === name)),
  }));
  const track1 = trackProgress(courses, 1);
  const track2 = hasTrack2 ? trackProgress(courses, 2) : null;

  return {
    liberalBasic,
    liberalBasicTotal: {
      have: liberalBasic.reduce((acc, r) => acc + Math.min(r.have, r.need), 0),
      need: REQ.liberalBasic.reduce((acc, r) => acc + r.need, 0),
    },
    areas,
    areaCount: { have: areas.filter((a) => a.credits > 0).length, need: REQ.liberalAreaMin },
    areaCredits: { have: areas.reduce((acc, a) => acc + a.credits, 0), need: REQ.liberalAreaCredits.min },
    track1,
    track2,
    majorTotal: { have: track1.total.have + (track2?.total.have ?? 0), need: REQ.major.total * 2 },
    totalCredits: { have: sum(courses), need: REQ.totalCredits },
    extraPoints: { have: points, need: REQ.extraPoints },
  };
}

/** 학번 앞 두 자리로 적용할 졸업요건 버전 이름을 고른다. */
export const requirementVersion = (entryYear: number) => specFor(entryYear).version;
