import { majorCourses } from "../data/curriculum";
import { normName } from "../data/hansung";
import { COLLEGES } from "../data/majors";
import type { Course, TrackRef } from "../types";
import { POINT, type Grade } from "./transcript";

// 학업 데이터 분석
// 입력: ① 성적표(과목·이수구분·학점·등급) ② 학기별 수강 계획 ③ 관심사 해시태그 ④ 비교과 활동
// 1) 성적 분석: 학기별 평점 추이, 이수구분별 평점, 분야(태그)별 평점 → 강점·약점 분야
// 2) 트랙 적합도: 성적 적합도 0.4 + 관심 적합도 0.35 + 진행도 0.25 (기획서 MATCH 점수식)
// 3) 페이스 점검: 남은 학기 대비 졸업학점·비교과 진도

export const WEIGHTS = { grade: 0.4, interest: 0.35, progress: 0.25 } as const;

export interface TakenCourse {
  course: Course;
  semester: number;
  grade?: Grade;
}

const pts = (g?: Grade) => (g ? POINT[g] : null);

export interface SemesterGpa {
  semester: number;
  gpa: number | null;
  credits: number;
}

export function semesterGpas(taken: TakenCourse[], upTo: number): SemesterGpa[] {
  return Array.from({ length: upTo + 1 }, (_, s) => {
    const mine = taken.filter((t) => t.semester === s);
    const graded = mine.filter((t) => pts(t.grade) !== null);
    const credits = graded.reduce((a, t) => a + t.course.credits, 0);
    return {
      semester: s,
      credits: mine.reduce((a, t) => a + t.course.credits, 0),
      gpa: credits ? Math.round((graded.reduce((a, t) => a + t.course.credits * (pts(t.grade) as number), 0) / credits) * 100) / 100 : null,
    };
  });
}

export interface FieldScore {
  tag: string;
  gpa: number;
  credits: number;
}

/** 분야(관심사 태그)별 평점. 성적이 있는 과목만 센다. */
export function fieldScores(taken: TakenCourse[]): FieldScore[] {
  const acc = new Map<string, { sum: number; credits: number }>();
  for (const t of taken) {
    const p = pts(t.grade);
    if (p === null || p === undefined) continue;
    for (const tag of t.course.tags) {
      const a = acc.get(tag) ?? { sum: 0, credits: 0 };
      a.sum += p * t.course.credits;
      a.credits += t.course.credits;
      acc.set(tag, a);
    }
  }
  return [...acc.entries()]
    .map(([tag, a]) => ({ tag, gpa: Math.round((a.sum / a.credits) * 100) / 100, credits: a.credits }))
    .filter((f) => f.credits >= 3)
    .sort((a, b) => b.gpa - a.gpa || b.credits - a.credits);
}

export interface TrackFit {
  ref: TrackRef;
  score: number;
  grade: number;
  interest: number;
  progress: number;
  /** 성적이 없어 성적 적합도를 중립값(0.5)으로 둔 경우 */
  gradeNeutral: boolean;
  reasons: string[];
}

function allTracks(): TrackRef[] {
  return COLLEGES.flatMap((college) =>
    college.units.flatMap((unit) => unit.tracks.filter((t) => !t.disabled).map((track) => ({ college: college.name, unit: unit.name, track }))),
  );
}

/** 모든 트랙에 대해 적합도를 계산해 높은 순으로 돌려준다. */
export function rankTracks(taken: TakenCourse[], interests: string[], exclude: string[]): TrackFit[] {
  const graded = taken.filter((t) => pts(t.grade) !== null && pts(t.grade) !== undefined);
  const takenNames = new Map(taken.map((t) => [normName(t.course.name), t.course.credits]));

  return allTracks()
    .filter((ref) => !exclude.includes(ref.track.id))
    .map((ref): TrackFit => {
      const courses = majorCourses(ref, 2);
      const tagCount = new Map<string, number>();
      for (const c of courses) for (const tag of c.tags) tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      const trackTags = new Set(tagCount.keys());

      // 관심 적합도: 내 관심사가 이 트랙 과목 태그에 얼마나 나오는지
      // 관심 적합도: 내 관심사가 이 트랙에 얼마나 나오는지(범위) + 트랙 과목 중 관심 분야 과목 비중(밀도)
      const hits = interests.filter((i) => trackTags.has(i));
      const coverage = interests.length ? hits.length / interests.length : 0;
      const density = courses.length ? courses.filter((c) => c.tags.some((t) => interests.includes(t))).length / courses.length : 0;
      const interest = 0.5 * coverage + 0.5 * density;

      // 성적 적합도: 이 트랙 분야와 겹치는 과목에서 받은 평점 (4.5 만점 → 0~1)
      const related = graded.filter((t) => t.course.tags.some((tag) => trackTags.has(tag)));
      const relCredits = related.reduce((a, t) => a + t.course.credits, 0);
      const gradeNeutral = relCredits === 0;
      const grade = gradeNeutral
        ? 0.5
        : related.reduce((a, t) => a + t.course.credits * (pts(t.grade) as number), 0) / relCredits / 4.5;

      // 진행도: 이미 들은(담은) 과목 중 이 트랙 전공으로 인정될 학점 / 39
      const doneCredits = courses.reduce((a, c) => a + (takenNames.get(normName(c.name)) ? c.credits : 0), 0);
      const progress = Math.min(doneCredits / 39, 1);

      const score = WEIGHTS.grade * grade + WEIGHTS.interest * interest + WEIGHTS.progress * progress;
      const reasons: string[] = [];
      if (hits.length) reasons.push(`관심사 ${hits.map((h) => `#${h}`).join(" ")}와 과목이 겹쳐요`);
      if (!gradeNeutral) reasons.push(`관련 과목 ${relCredits}학점 평점 ${(grade * 4.5).toFixed(2)}`);
      if (doneCredits) reasons.push(`이미 ${doneCredits}학점이 이 트랙 전공으로 인정돼요`);
      return { ref, score: Math.round(score * 100), grade, interest, progress, gradeNeutral, reasons };
    })
    .sort((a, b) => b.score - a.score);
}
