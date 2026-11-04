import type { Catalog, Course } from "../types";

// 성적표 캡처 자동 입력.
// 데모에서는 이미지 인식 대신 샘플 결과를 돌려준다.
// 실제 버전: ai/ocr 이 성적표 이미지에서 학기·과목명·학점·성적을 읽고, 과목명을 교육과정 DB와 맞춘다.
// 이후 단계: 학교 SSO 로그인 → 종합정보시스템 성적·이수내역 연동으로 캡처 없이 바로 반영(학교 협의 필요).

export const GRADES = ["A+", "A0", "B+", "B0", "C+", "C0", "D+", "D0", "F", "P"] as const;
export type Grade = (typeof GRADES)[number];

export const POINT: Record<Grade, number | null> = {
  "A+": 4.5,
  A0: 4.0,
  "B+": 3.5,
  B0: 3.0,
  "C+": 2.5,
  C0: 2.0,
  "D+": 1.5,
  D0: 1.0,
  F: 0,
  P: null,
};

export interface TranscriptRow {
  semester: number;
  courseId: string;
  name: string;
  category: Course["category"];
  credits: number;
  grade: Grade;
}

/** 평점평균 (4.5 만점). P 과목은 평점에서 뺀다. */
export function gpa(rows: { credits: number; grade: Grade }[]): number | null {
  const graded = rows.filter((r) => POINT[r.grade] !== null);
  const credits = graded.reduce((acc, r) => acc + r.credits, 0);
  if (!credits) return null;
  const total = graded.reduce((acc, r) => acc + r.credits * (POINT[r.grade] as number), 0);
  return Math.round((total / credits) * 100) / 100;
}

const SAMPLE_GRADES: Grade[] = ["A+", "A0", "B+", "A0", "A+", "B+", "A0", "B0", "A+", "A0", "B+", "A+"];

/** 1학년 1·2학기 성적표를 읽은 것처럼 샘플 결과를 만든다. */
export function sampleTranscript(catalog: Catalog): TranscriptRow[] {
  const used = new Set<string>();
  const pick = (pred: (c: Course) => boolean, n: number) => {
    const out = catalog.courses.filter((c) => !used.has(c.id) && pred(c)).slice(0, n);
    out.forEach((c) => used.add(c.id));
    return out;
  };
  const sem1 = [
    ...pick((c) => c.category === "필수교양", 2),
    ...pick((c) => c.trackSlot === 1 && c.grade === 1 && c.term === 1, 3),
    ...pick((c) => c.category === "선택필수교양", 1),
  ];
  const sem2 = [
    ...pick((c) => c.category === "필수교양", 2),
    ...pick((c) => c.trackSlot === 1 && c.grade === 1 && c.term === 2, 3),
    ...pick((c) => c.category === "선택필수교양", 1),
  ];
  let g = 0;
  const row = (semester: number) => (c: Course): TranscriptRow => ({
    semester,
    courseId: c.id,
    name: c.name,
    category: c.category,
    credits: c.credits,
    grade: SAMPLE_GRADES[g++ % SAMPLE_GRADES.length]!,
  });
  return [...sem1.map(row(0)), ...sem2.map(row(1))];
}
