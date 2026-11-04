// 트랙(학과)별 졸업요건 — 각 단과대학 홈페이지 「졸업요건/트랙졸업요건」 페이지 요약 (2026-11-04 확인).
// rule: all = 모두 충족, any = 하나 이상, count = n개 이상. 원문 링크를 함께 보여주고, 최종 확인은 학과 사무실 기준.

export interface TrackGrad {
  url: string;
  rule: "all" | "any" | "count" | "info";
  need?: number;
  items: string[];
  note?: string;
}

const H = "https://www.hansung.ac.kr";
const ie = (path: string) => `${H}${path}/subview.do`;

const IE_COMMON = ["트랙 인정 자격증 1개 이상 취득", "전국 규모 교외 공모전 입상", "전국 학술대회 구두 발표 또는 등재후보지 이상 논문 게재", "트랙 인정 졸업 논문(작품·프로젝트) 제출"];
const IE_NOTE = "졸업 직전 학기에 증빙 서류를 학과에 제출하고 트랙 주임교수가 심사해요.";
const CSE: TrackGrad = {
  url: ie("/CSE/1564"),
  rule: "all",
  items: [
    "캡스톤디자인 발표회 작품 출품 · 졸업 논문 · 전공 자격증/공모전 입상 중 1개 이상 (24학번부터 캡스톤디자인 수강 필수)",
    "산학협력 프로젝트 이수: 기업연계 SW캡스톤디자인·온캠퍼스인턴십·현장실습 교과, 산학공동연구, 재학 중 취업 경력 중 1개 (2028년 2월 졸업예정자부터)",
    "GitHub 활동 이력서 제출 권장 (17학번부터)",
  ],
  note: "컴퓨터공학부 공통 기준이에요. 신청은 6월·12월 학부 공지로 안내돼요.",
};
const MECH = (base: string, cap: string, other: string, url: string): TrackGrad => ({
  url,
  rule: "all",
  items: [`트랙 과목 13개(39학점) 이상 이수`, `1학년 ${base} 수강`, "2~3학년 트랙 필수 5과목 중 4과목 이상", `4학년 ${cap} 졸업 논문 수강`],
  note: `${other} 2~4학년 지정 과목도 인정돼요.`,
});
const DANCE: TrackGrad = { url: ie("/HmnArt/5667"), rule: "all", items: ["창작발표회 2회 참여", "졸업작품 발표"] };
const LIS = (url: string, extra?: string): TrackGrad => ({
  url,
  rule: "info",
  items: [
    "졸업시험: 출제 과목 중 3과목 응시, 과목당 70점 이상 합격 (불합격 시 수료)",
    "시험은 1학기 2회·2학기 1회",
    "TOEIC 700·정보처리기사·컴활 2급·ADsP·SQLD·한국사 3급 등 대체 자격증으로 최대 4과목 대체",
    "800pt를 넘겨 전공 비교과 150pt 이상이면 1과목 대체",
    ...(extra ? [extra] : []),
  ],
});

export const TRACK_GRAD: Record<string, TrackGrad> = {
  AI응용학과: {
    url: ie("/CreCon/2781"),
    rule: "all",
    items: [
      "졸업 인증: TOEIC 700 이상 · 단독 제1저자 논문 · 교내외 공모전 참여(SW중심대학 디지털 경진대회 등) 중 1개 이상",
      "인공지능 캡스톤디자인 이수 (2027년 2월 졸업예정자부터)",
      "기업연계형 프로젝트: 기업연계 AI캡스톤디자인·산학협력프로젝트 이수 또는 산학공동연구 참여 중 1개 (25학번부터)",
    ],
    note: "모두 채운 뒤 학과 사무실에 졸업요건 인정 신청서를 내야 최종 인정돼요.",
  },
  융합보안학과: {
    url: ie("/CreCon/2791"),
    rule: "all",
    items: [
      "보안 엔지니어링 역량: 학술대회 발표·학술지 게재(1저자)·교외 공모전 입상·캡스톤디자인 참여·정보처리기사 중 1개",
      "암호·인증 역량: 학술대회 발표·학술지 게재(1저자)·교외 공모전 입상·캡스톤디자인 참여 중 1개",
      "산학협력 프로젝트형 교과 1과목 이상 이수 (25학번부터)",
    ],
    note: "보안 엔지니어링·암호인증 중 소속 역량 기준을 따라요.",
  },
  미래모빌리티학과: { url: ie("/CreCon/2800"), rule: "all", items: ["종합설계프로젝트 Ⅰ 이수", "종합설계프로젝트 Ⅱ 이수"] },
  문학문화콘텐츠학과: { url: ie("/CreCon/2772"), rule: "info", items: ["역량점수제(필수 3점 포함 20점 이상) — 세부 기준은 학과 첨부파일(hwp) 확인"] },
  문학문화콘텐츠트랙: {
    url: ie("/HmnArt/5596"),
    rule: "info",
    items: ["4년간 역량점수 20점 이상 (필수: 지도교수 상담 3점 포함)", "지도교수 상담 학기당 1점(최대 6)", "문화자원 콘텐츠화 프로젝트(최대 6)", "봉사·학내외 활동·자격증·공모전 입상(각 최대 5)"],
  },
  지식정보문화트랙: LIS(ie("/HmnArt/5618")),
  디지털인문정보학트랙: LIS(ie("/HmnArt/5625"), "웹콘텐츠 출판으로 2과목 대체 가능"),
  역사문화큐레이션트랙: { url: ie("/HmnArt/5632"), rule: "info", items: ["학과 홈페이지에 이미지로만 공개돼 있어요 — 원문 링크에서 확인"] },
  역사콘텐츠트랙: { url: ie("/HmnArt/5639"), rule: "info", items: ["학과 홈페이지에 이미지로만 공개돼 있어요 — 원문 링크에서 확인"] },
  영미문화콘텐츠트랙: { url: ie("/HmnArt/5646"), rule: "info", items: ["학과 페이지 준비 중 — 학과 사무실(02-760-4027) 문의"] },
  한국무용전공: DANCE,
  현대무용전공: { ...DANCE, url: ie("/HmnArt/5674") },
  발레전공: { ...DANCE, url: ie("/HmnArt/5681") },
  패션마케팅트랙: { url: ie("/Design/5108"), rule: "info", items: ["학과 홈페이지에 이미지로만 공개돼 있어요 — 원문 링크에서 확인"] },
  패션디자인트랙: { url: ie("/Design/5115"), rule: "info", items: ["학과 홈페이지에 이미지로만 공개돼 있어요 — 원문 링크에서 확인"] },
  패션크리에이티브디렉션트랙: { url: ie("/Design/5122"), rule: "info", items: ["학과 홈페이지에 이미지로만 공개돼 있어요 — 원문 링크에서 확인"] },
  모바일소프트웨어트랙: CSE,
  빅데이터트랙: CSE,
  "디지털콘텐츠·가상현실트랙": CSE,
  웹공학트랙: CSE,
  전자트랙: { url: ie("/Engineering/4920"), rule: "info", items: ["학과 게시판 첨부파일로 공개 — 원문 링크에서 확인"] },
  시스템반도체트랙: { url: ie("/Engineering/4927"), rule: "info", items: ["학과 게시판 첨부파일로 공개 — 원문 링크에서 확인"] },
  기계시스템디자인트랙: MECH("창의적기계설계", "기계시스템디자인캡스톤디자인", "AI로봇융합트랙", ie("/Engineering/4934")),
  AI로봇융합트랙: MECH("로봇공학기초", "AI로봇융합캡스톤디자인", "기계시스템디자인트랙", ie("/Engineering/4941")),
  산업공학트랙: { url: ie("/Engineering/4997"), rule: "any", items: IE_COMMON, note: `인정 자격증: 품질경영·인간공학·산업안전·정보처리·빅데이터분석기사, 물류관리사, ERP 1급 등. ${IE_NOTE}` },
  응용산업데이터공학트랙: { url: ie("/Engineering/5025"), rule: "any", items: IE_COMMON, note: `인정 자격증: 물류관리사, 정보처리기사, ERP 1급, 빅데이터분석기사, CPIM, SAP 등. ${IE_NOTE}` },
  융합행정학과: {
    url: ie("/futureplus/721"),
    rule: "any",
    items: ["졸업논문 제출 (법학사는 필수)", "공무원 채용시험 합격", "행정사·사회조사분석사 2급·정보처리기사·컴활 2급 등 자격증", "TOEIC 750 이상 등 영어 성적"],
  },
  호텔외식경영학과: { url: ie("/futureplus/721"), rule: "all", items: ["캡스톤디자인 2과목 이수 후 졸업작품 80점 이상 (24학번부터)"] },
  뷰티디자인학과: { url: ie("/futureplus/721"), rule: "all", items: ["졸업작품(50)+포트폴리오(50) 합산 80점 이상"] },
  비즈니스컨설팅학과: { url: ie("/futureplus/721"), rule: "any", items: ["졸업논문·프로젝트 제출", "SAP·사회조사분석사 2급·경영지도사 등 자격증", "교외 공모전 입상", "학회 논문 발표"] },
  ICT융합디자인학과: { url: ie("/futureplus/721"), rule: "all", items: ["졸업작품 심사 80점 이상"] },
  "AI·소프트웨어학과": { url: ie("/futureplus/721"), rule: "any", items: ["졸업작품 제출·평가", "교내외 공모전 입상", "학술대회 발표 또는 학술지 게재"] },
  한국언어문화교육학과: { url: ie("/global/7579"), rule: "info", items: ["졸업역량점수(마일리지) 기준 충족: 교육봉사·교육 프로그램, 전공역량 강화, TOPIK 4급 이상, 영어·제2외국어 점수"] },
  글로벌K비즈니스학과: {
    url: ie("/global/7580"),
    rule: "count",
    need: 4,
    items: ["현장학습·현장연계형 수업", "프로젝트형(PBL) 수업", "취업 또는 취업준비 프로그램 이수", "컴퓨터활용 수업·프로그램", "외국어 특별수업·프로그램", "캡스톤디자인 결과물 성과공유"],
  },
  영상엔터테인먼트학과: { url: ie("/global/7581"), rule: "any", items: ["연기 오디션 포트폴리오 발표·상영회", "영상(3분 이상) 제작 포트폴리오 제출·상영회"] },
  패션뷰티크리에이션학과: { url: ie("/global/7582"), rule: "count", need: 2, items: ["패션뷰티컬렉션 참여", "뷰티 산학협력 프로젝트 참여", "전공 기술자격증", "전공 공모전 참가", "TOPIK 4급 이상"] },
  SW융합학과: { url: ie("/global/7583"), rule: "any", items: ["교외 학술대회 발표(1저자)", "학술지 게재(1저자)", "교외 공모전 입상", "캡스톤디자인 참여", "TOPIK 4급 이상"] },
  글로벌벤처창업학과: { url: ie("/global/7584"), rule: "count", need: 2, items: ["캡스톤디자인 이수", "학과 인정 창업경진대회 입상", "TOPIK 4급 이상"] },
};

export const RULE_LABEL = (g: TrackGrad) =>
  g.rule === "all" ? "모두 충족" : g.rule === "any" ? "하나 이상 충족" : g.rule === "count" ? `${g.need}개 이상 충족` : "안내";

/** 체크한 항목으로 충족 여부 판단 (info는 판단하지 않음) */
export function gradMet(g: TrackGrad, checked: boolean[]): boolean | null {
  const n = checked.filter(Boolean).length;
  if (g.rule === "all") return n === g.items.length;
  if (g.rule === "any") return n >= 1;
  if (g.rule === "count") return n >= (g.need ?? 1);
  return null;
}
