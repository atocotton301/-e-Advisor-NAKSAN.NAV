/** 교과 계열. 같은 계열의 트랙은 데모용 샘플 교육과정을 공유한다. */
export type Family =
  | "ai"
  | "cs"
  | "security"
  | "design"
  | "media"
  | "fashion"
  | "beauty"
  | "business"
  | "econ"
  | "public"
  | "humanities"
  | "fineart"
  | "dance"
  | "engineering"
  | "industrial";

export interface Track {
  id: string;
  name: string;
  family: Family;
  room: string;
  phone: string;
  note?: string;
  /** 아직 신입생을 받지 않는 신설 학과 등 */
  disabled?: boolean;
}

/** 학부 또는 학과 */
export interface Unit {
  name: string;
  note?: string;
  tracks: Track[];
}

export interface College {
  name: string;
  en: string;
  note?: string;
  units: Unit[];
}

export interface TrackRef {
  college: string;
  unit: string;
  track: Track;
}

export type Category = "전공기초" | "전공필수" | "전공선택" | "필수교양" | "선택필수교양" | "일반선택";

export interface Course {
  id: string;
  name: string;
  category: Category;
  credits: number;
  /** 권장 학년. 교양·일반선택은 0(전 학년) */
  grade: number;
  tags: string[];
  professorId: string;
  /** 전공 과목이 몇 번째 트랙 소속인지 */
  trackSlot?: 1 | 2;
  /** 필수교양 그룹 또는 선택필수교양 분야 */
  group?: string;
}

export interface Activity {
  id: string;
  name: string;
  host: string;
  points: number;
  tags: string[];
}

export interface Paper {
  title: string;
  venue: string;
  year: number;
  plain: string;
}

export interface Professor {
  id: string;
  name: string;
  dept: string;
  focus: string;
  papers: Paper[];
}

export interface Catalog {
  courses: Course[];
  activities: Activity[];
  professors: Record<string, Professor>;
}

export interface Student {
  studentId: string;
  entryYear: number;
  track1: TrackRef;
  track2?: TrackRef;
  interests: string[];
}

export interface SemesterPlan {
  courseIds: string[];
  activityIds: string[];
}

export type Mood = "happy" | "normal" | "sad";
