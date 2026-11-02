import type { Course } from "../types";

// 수업계획서 원문은 학교 DB에서 가져올 데이터. 데모에서는 과목 정보로 형식만 채운다.

export interface Syllabus {
  schedule: string;
  room: string;
  method: string;
  overview: string;
  goals: string[];
  weeks: { week: string; topic: string }[];
  grading: { label: string; ratio: number }[];
}

// backend/engines/timetable/timetable_slots.csv 의 주간 교시
const MWT_SLOTS = [
  ["1~2", "09:00~10:15"],
  ["2M~3M", "10:30~11:45"],
  ["4~5", "12:00~13:15"],
  ["5M~6M", "13:30~14:45"],
  ["7~8", "15:00~16:15"],
] as const;
const TF_SLOTS = [
  ["2", "10:00~10:50"],
  ["3", "11:00~11:50"],
  ["5", "13:00~13:50"],
  ["6", "14:00~14:50"],
] as const;
const MWT_DAYS = ["월·수", "수·목", "월·목"];
const BUILDINGS = ["진리관", "지선관", "창의관", "우촌관", "낙산관", "상상관"];

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

const pick = <T,>(list: readonly T[], seed: number): T => list[seed % list.length]!;

const isStudio = (name: string) => /스튜디오|실기|드로잉|훈련|공연|작품|컬렉션|캡스톤|제작/.test(name);

export function buildSyllabus(course: Course): Syllabus {
  const seed = hash(course.id);
  const [slot, time] = course.credits >= 3 ? pick(MWT_SLOTS, seed) : pick(TF_SLOTS, seed);
  const days = course.credits >= 3 ? pick(MWT_DAYS, seed >> 3) : "화·금";
  const studio = isStudio(course.name);
  const topic = course.tags.slice(0, 2).map((t) => `#${t}`).join(" ");

  return {
    schedule: `${days} ${slot} (${time})`,
    room: `${pick(BUILDINGS, seed >> 5)} ${100 + (seed % 5) * 100 + (seed % 9)}호`,
    method: studio ? "실습·프로젝트 중심 (PBL)" : "이론 강의 + 실습",
    overview: `${course.name}은(는) ${course.category} 과목으로, ${topic} 분야의 핵심 개념을 익히고 직접 결과물을 만들어 보는 수업입니다.`,
    goals: [
      `${course.name}의 기본 개념과 용어를 설명할 수 있다.`,
      "배운 내용을 실제 문제나 작품에 적용할 수 있다.",
      "팀 활동으로 결과물을 기획·발표할 수 있다.",
    ],
    weeks: [
      { week: "1주", topic: "오리엔테이션, 수업 소개" },
      { week: "2~4주", topic: `${course.name} 핵심 개념` },
      { week: "5~7주", topic: studio ? "개인 실습 과제 I" : "사례 분석과 실습" },
      { week: "8주", topic: studio ? "중간 크리틱" : "중간고사" },
      { week: "9~13주", topic: "심화 주제와 팀 프로젝트" },
      { week: "14주", topic: "프로젝트 발표" },
      { week: "15주", topic: studio ? "최종 결과물 전시·평가" : "기말고사" },
    ],
    grading: studio
      ? [
          { label: "프로젝트", ratio: 50 },
          { label: "과제", ratio: 30 },
          { label: "출석·태도", ratio: 20 },
        ]
      : [
          { label: "중간고사", ratio: 30 },
          { label: "기말고사", ratio: 30 },
          { label: "과제", ratio: 30 },
          { label: "출석", ratio: 10 },
        ],
  };
}
