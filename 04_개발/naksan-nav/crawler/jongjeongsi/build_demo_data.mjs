// 종합정보시스템에서 모은 원본(data/raw/jongjeongsi/*.json)을 웹 데모용 데이터로 바꾼다.
//
//   node crawler/jongjeongsi/build_demo_data.mjs
//
// 입력 (공개 저장소에 올리지 않는 data/raw/)
//   hsu_timetable_2026.json      시간표 및 수업계획서조회: 전공·교양 영역별 개설 분반
//   hsu_syllabi_2026-1.json      수업계획서 (교수·과목 조합당 1개, 이메일·휴대전화·면담 정보 제외)
//   hsu_syllabi_2026-2.json
// 출력
//   apps/web/src/data/jongjeongsi.ts                 개설 과목·분반 (번들에 포함)
//   apps/web/public/data/syllabi/<학기>/<NN>.json      과목 해설·수업계획서 (열 때만 불러옴)

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RAW = join(ROOT, "data", "raw", "jongjeongsi");
const WEB = join(ROOT, "apps", "web");

const SEMESTERS = { 20261: "2026-1", 20262: "2026-2" };

/** apps/web/src/lib/realSyllabus.ts 의 BUCKETS·bucketOf 와 같아야 한다. */
const BUCKETS = 32;
function bucketOf(code) {
  let h = 5381;
  for (let i = 0; i < code.length; i++) h = ((h * 33) ^ code.charCodeAt(i)) >>> 0;
  return h % BUCKETS;
}

// 종합정보시스템 이수구분 → 데모 Category
const CATEGORY = {
  전기: "전공기초",
  전필: "전공필수",
  전선: "전공선택",
  MD전선: "전공선택",
  복전선: "전공선택",
  교필: "필수교양",
  선필교: "선택필수교양",
  일선: "일반선택",
  일교: "일반선택",
};

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE = /(?:\+?82[-.\s]?)?0\d{1,2}[-.\s)]?\d{3,4}[-.\s]?\d{4}/;

/** 공개 저장소로 나가는 데이터에 이메일·전화번호가 남아 있으면 멈춘다. */
function assertNoContacts(label, value) {
  const text = JSON.stringify(value);
  const hit = text.match(EMAIL) ?? text.match(PHONE);
  if (hit) throw new Error(`${label}: 연락처로 보이는 문자열이 남아 있어요 → ${hit[0].slice(0, 6)}…`);
}

/** "온라인강좌 1.5시간 / 공학관309  수5M~6M" → { room, time } */
function splitClassroom(raw) {
  const s = raw.replace(/\s+/g, " ").trim();
  const i = s.search(/[월화수목금토일]\s*\d/);
  if (i < 0) return { room: s, time: "" };
  return { room: s.slice(0, i).replace(/[\s/,]+$/, ""), time: s.slice(i) };
}

const readJson = (name) => JSON.parse(readFileSync(join(RAW, name), "utf8"));

// ---------- 개설 과목·분반 ----------

const timetable = readJson("hsu_timetable_2026.json");
const courses = {};
const majors = {};
const descriptions = {};
const unknownCategory = new Map();

for (const [yh, sem] of Object.entries(timetable.semesters)) {
  const label = SEMESTERS[yh];
  if (!label) continue;
  const byCode = (courses[label] = {});
  const listings = (majors[label] = {});
  const desc = (descriptions[label] = {});
  const sectionKeys = new Map();

  for (const major of sem.majors) {
    const listing = new Map();
    for (const r of sem.rows[major.code] ?? []) {
      const category = CATEGORY[r.isugubun];
      if (!category) {
        unknownCategory.set(r.isugubun, (unknownCategory.get(r.isugubun) ?? 0) + 1);
        continue;
      }
      const code = r.kwamokcode;
      const grade = r.haknean === "전학년" ? 0 : Number(r.haknean) || 0;
      // 교양은 과목군(인문학·사회과학·예술과 체육 …)을 함께 둔다.
      const area = r.gwamokgun && r.gwamokgun !== category ? r.gwamokgun : "";
      if (!listing.has(code)) listing.set(code, area ? [code, category, grade, area] : [code, category, grade]);

      const course = (byCode[code] ??= { code, name: r.kwamokname, credits: Number(r.hakjum) || 0, sections: [] });
      const keys = sectionKeys.get(code) ?? new Set();
      sectionKeys.set(code, keys);
      const key = r.plan || `${r.bunban}|${r.prof}|${r.classroom}`;
      if (!keys.has(key)) {
        keys.add(key);
        const { room, time } = splitClassroom(r.classroom);
        const section = { sec: r.bunban, prof: r.prof.trim(), time, room };
        if (r.juya && r.juya !== "주") section.juya = r.juya;
        if (r.bigo) section.note = r.bigo;
        course.sections.push(section);
      }
      if (r.kcomment && !desc[code]) desc[code] = { desc: r.kcomment, en: r.ekname || undefined };
    }
    if (listing.size) listings[major.name] = [...listing.values()];
  }
  for (const c of Object.values(byCode)) c.sections.sort((a, b) => a.sec.localeCompare(b.sec, "ko"));
}
if (unknownCategory.size) console.warn("모르는 이수구분(건너뜀):", Object.fromEntries(unknownCategory));
assertNoContacts("개설 과목", courses);

const collectedAt = timetable.collectedAt?.slice(0, 10) ?? "";
const ts = `// 자동 생성 파일: crawler/jongjeongsi/build_demo_data.mjs 로 다시 만든다. 직접 고치지 말 것.
// 출처: 한성대 종합정보시스템 「시간표 및 수업계획서조회」 (${collectedAt} 수집, 2026-1·2026-2학기)
import type { Category } from "../types";

export type JsSemester = "2026-1" | "2026-2";

export interface JsSection {
  sec: string;
  prof: string;
  /** 요일·교시 (예: 월2M~3M,수2M~3M) */
  time: string;
  /** 강의실 (온라인 강좌는 "온라인강좌 1.5시간 / 공학관309" 처럼 함께 적힘) */
  room: string;
  /** 야: 야간, 합: 주야 모두 수강 가능 */
  juya?: string;
  note?: string;
}

export interface JsCourse {
  code: string;
  name: string;
  credits: number;
  sections: JsSection[];
}

/** 전공(트랙·학과)·교양 영역별 개설 과목: [과목코드, 이수구분, 학년(0 = 전 학년), 교양 과목군] */
export type JsListing = [code: string, category: Category, grade: number, area?: string];

export const JS_COLLECTED_AT = ${JSON.stringify(collectedAt)};

export const JS_COURSES: Record<JsSemester, Record<string, JsCourse>> = ${JSON.stringify(courses)};

export const JS_MAJORS: Record<JsSemester, Record<string, JsListing[]>> = ${JSON.stringify(majors)};
`;
writeFileSync(join(WEB, "src", "data", "jongjeongsi.ts"), ts);

// ---------- 과목 해설·수업계획서 (조각 파일) ----------

const compactSyllabus = (s) => {
  const out = {
    sec: s.sec,
    credit: s.credit,
    time: s.time,
    target: s.target,
    prof: s.prof,
    dept: s.dept,
    grading: s.grading,
    overview: s.overview,
    goals: s.goals,
    prereq: s.prereq,
    book: s.book,
    subbook: s.subbook,
    notes: s.notes,
    outcomes: s.outcomes,
    weeks: s.weeks.map(({ topic, online, m, flip }) => ({ topic, online, m, flip })),
    type: s.type,
    competency: s.competency,
  };
  for (const [k, v] of Object.entries(out)) if (v === "" || v == null) delete out[k];
  return out;
};

const syllabiDir = join(WEB, "public", "data", "syllabi");
if (existsSync(syllabiDir)) rmSync(syllabiDir, { recursive: true });
const stats = {};

for (const [yh, label] of Object.entries(SEMESTERS)) {
  const file = `hsu_syllabi_${label}.json`;
  const buckets = Array.from({ length: BUCKETS }, () => ({ courses: {}, syllabi: {} }));
  for (const [code, d] of Object.entries(descriptions[label] ?? {})) buckets[bucketOf(code)].courses[code] = d;

  let count = 0;
  if (existsSync(join(RAW, file))) {
    const raw = readJson(file);
    for (const [key, item] of Object.entries(raw.items ?? {})) {
      if (!item) continue;
      const code = key.split("|")[0];
      buckets[bucketOf(code)].syllabi[key] = compactSyllabus(item);
      count++;
    }
  } else {
    console.warn(`${file} 이 없어 과목 해설만 만듭니다.`);
  }

  const dir = join(syllabiDir, label);
  mkdirSync(dir, { recursive: true });
  let bytes = 0;
  buckets.forEach((b, i) => {
    assertNoContacts(`${label} 조각 ${i}`, b);
    const text = JSON.stringify(b);
    bytes += Buffer.byteLength(text);
    writeFileSync(join(dir, `${String(i).padStart(2, "0")}.json`), text);
  });
  stats[label] = { syllabi: count, descriptions: Object.keys(descriptions[label] ?? {}).length, kb: Math.round(bytes / 1024) };
}

const tsKb = Math.round(Buffer.byteLength(ts) / 1024);
for (const [label, byCode] of Object.entries(courses)) {
  const sections = Object.values(byCode).reduce((acc, c) => acc + c.sections.length, 0);
  console.log(`${label}: 과목 ${Object.keys(byCode).length}개, 분반 ${sections}개, 영역 ${Object.keys(majors[label]).length}개`, stats[label] ?? "");
}
console.log(`jongjeongsi.ts ${tsKb}KB`);
