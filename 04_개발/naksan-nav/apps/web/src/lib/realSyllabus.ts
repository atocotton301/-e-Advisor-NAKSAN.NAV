// 종합정보시스템 수업계획서·과목 해설.
// crawler/jongjeongsi/build_demo_data.mjs 가 public/data/syllabi/<학기>/<NN>.json 으로 과목코드별 32조각을 만들고,
// 화면에서는 계획서를 열 때 해당 조각 하나만 불러온다.

/** build_demo_data.mjs 의 BUCKETS·bucketOf 와 같아야 한다. */
export const BUCKETS = 32;
export function bucketOf(code: string): number {
  let h = 5381;
  for (let i = 0; i < code.length; i++) h = ((h * 33) ^ code.charCodeAt(i)) >>> 0;
  return h % BUCKETS;
}

export type SyllabusSemester = "2026-1" | "2026-2";

export interface RealSyllabus {
  sec?: string;
  /** 예: 3학점_전공선택 */
  credit?: string;
  time?: string;
  target?: string;
  prof?: string;
  dept?: string;
  grading?: { attendance: number; midterm: number; final: number; assignment: number; presentation: number; attitude: number };
  overview?: string;
  goals?: string;
  prereq?: string;
  book?: string;
  subbook?: string;
  notes?: string;
  outcomes?: { goal: string; eval: string }[];
  /** m: 수업 방식 (t 이론 · pt 실습 · p 발표 · d 토론), flip: 플립러닝 주차 */
  weeks?: { topic: string; online: string; m: string; flip: boolean }[];
  type?: { offline?: string; online?: string; pbl?: string; english?: string; ai?: string; teamTeaching?: string; industry?: string; capstone?: string };
}

export interface CourseInfo {
  desc: string;
  en?: string;
}

interface Bucket {
  courses: Record<string, CourseInfo>;
  syllabi: Record<string, RealSyllabus>;
}

const cache = new Map<string, Promise<Bucket | null>>();

function loadBucket(sem: SyllabusSemester, code: string): Promise<Bucket | null> {
  const url = `${import.meta.env.BASE_URL}data/syllabi/${sem}/${String(bucketOf(code)).padStart(2, "0")}.json`;
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<Bucket>) : null))
      .catch(() => {
        // 오프라인 등으로 실패하면 다음에 다시 시도한다.
        cache.delete(url);
        return null;
      });
    cache.set(url, pending);
  }
  return pending;
}

export interface LoadedSyllabus {
  info?: CourseInfo;
  syllabus?: RealSyllabus;
  /** 요청한 교수의 계획서가 없어 같은 과목 다른 교수의 계획서를 보여줄 때 */
  otherProf?: boolean;
}

/** 과목코드·교수 이름으로 그 학기 수업계획서를 찾는다. 교수 계획서가 없으면 같은 과목의 다른 계획서라도 돌려준다. */
export async function loadRealSyllabus(sem: SyllabusSemester, code: string, prof: string): Promise<LoadedSyllabus> {
  const bucket = await loadBucket(sem, code);
  if (!bucket) return {};
  const info = bucket.courses[code];
  const own = bucket.syllabi[`${code}|${prof}`];
  if (own) return { info, syllabus: own };
  const other = Object.entries(bucket.syllabi).find(([key]) => key.startsWith(`${code}|`))?.[1];
  return other ? { info, syllabus: other, otherProf: true } : { info };
}
