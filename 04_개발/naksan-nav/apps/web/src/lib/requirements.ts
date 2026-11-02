import type { Course } from "../types";

// 「개인별 교육과정 이수 현황 조회」 화면 기준 (19~23학번). 학번별 요건 버전은 backend CHECK 엔진으로 옮길 예정.
export const REQ = {
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
  liberalAreas: ["예술과 스포츠", "인문학적 상상력", "사회과학적 상상력", "과학기술 상상력", "융합적 상상력"],
  liberalAreaMin: 3,
  liberalAreaCredits: { min: 7, max: 9 },
} as const;

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
export function requirementVersion(entryYear: number): string {
  const yy = entryYear % 100;
  if (yy <= 15) return "15학번 이전";
  if (yy <= 18) return "16~18학번";
  if (yy <= 23) return "19~23학번";
  return "24학번 이후";
}
