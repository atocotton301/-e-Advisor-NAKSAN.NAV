import type { Activity, Course } from "../types";

// 4년 설계 → 취업 준비 분석 (규칙 기반).
// 과목·비교과의 관심사 태그를 역량으로 보고, 직무별 핵심 역량과 얼마나 겹치는지 계산한다.
// 실제 서비스에서는 팀 서버 AI가 채용공고·직무기술서(NCS)와 비교해 같은 형식으로 채운다.

export interface Job {
  name: string;
  /** 핵심 역량(관심사 태그) — 앞쪽일수록 중요 */
  core: string[];
  certs: { name: string; url: string }[];
  /** 포트폴리오로 보여줄 것 */
  portfolio: string;
}

const Q = "https://www.q-net.or.kr";
const DATAQ = "https://www.dataq.or.kr";

export const JOBS: Job[] = [
  { name: "AI 엔지니어", core: ["인공지능", "데이터분석", "클라우드", "웹개발"], certs: [{ name: "정보처리기사", url: Q }, { name: "ADsP", url: DATAQ }, { name: "빅데이터분석기사", url: DATAQ }], portfolio: "모델 학습부터 배포까지 해 본 프로젝트 1~2개 (GitHub·데모)" },
  { name: "데이터 분석가", core: ["데이터분석", "인공지능", "마케팅", "금융투자"], certs: [{ name: "ADsP", url: DATAQ }, { name: "SQLD", url: DATAQ }, { name: "빅데이터분석기사", url: DATAQ }], portfolio: "공공데이터·캐글 분석 리포트, 대시보드" },
  { name: "백엔드·웹 개발자", core: ["웹개발", "클라우드", "보안", "데이터분석"], certs: [{ name: "정보처리기사", url: Q }, { name: "SQLD", url: DATAQ }], portfolio: "직접 배포한 웹 서비스, API 설계 문서" },
  { name: "모바일 앱 개발자", core: ["앱개발", "UXUI", "웹개발", "클라우드"], certs: [{ name: "정보처리기사", url: Q }], portfolio: "스토어에 올린 앱 또는 앱 데모 영상" },
  { name: "정보보안 전문가", core: ["보안", "클라우드", "웹개발"], certs: [{ name: "정보보안기사", url: Q }, { name: "정보처리기사", url: Q }], portfolio: "CTF 참가 기록, 취약점 분석 보고서" },
  { name: "게임·XR 개발자", core: ["게임", "메타버스", "애니메이션", "앱개발"], certs: [{ name: "게임프로그래밍전문가", url: Q }], portfolio: "플레이 가능한 게임·XR 데모" },
  { name: "로봇·임베디드 엔지니어", core: ["로봇", "반도체", "인공지능"], certs: [{ name: "임베디드기사", url: Q }, { name: "전자기사", url: Q }], portfolio: "하드웨어 제작·제어 프로젝트 영상" },
  { name: "반도체 엔지니어", core: ["반도체", "로봇"], certs: [{ name: "전자기사", url: Q }, { name: "반도체설계기사", url: Q }], portfolio: "회로 설계·검증 프로젝트" },
  { name: "UX/UI 디자이너", core: ["UXUI", "디자인", "브랜딩", "심리"], certs: [{ name: "컴퓨터그래픽스운용기능사", url: Q }], portfolio: "사용자 조사부터 화면 설계까지 담은 케이스 스터디" },
  { name: "영상·콘텐츠 크리에이터", core: ["영상", "애니메이션", "문화콘텐츠", "브랜딩"], certs: [], portfolio: "릴·영상 포트폴리오, 채널 운영 기록" },
  { name: "마케터·브랜드 매니저", core: ["마케팅", "브랜딩", "데이터분석", "글쓰기"], certs: [{ name: "사회조사분석사", url: Q }, { name: "GAIQ(구글 애널리틱스)", url: "https://skillshop.withgoogle.com" }], portfolio: "캠페인 기획서, 성과 분석 리포트" },
  { name: "재무·회계 전문가", core: ["회계", "금융투자", "경영전략", "데이터분석"], certs: [{ name: "전산회계", url: "https://license.kacpta.or.kr" }, { name: "재경관리사", url: "https://www.samilexam.com" }], portfolio: "재무제표 분석, 투자 리포트" },
  { name: "무역·글로벌 비즈니스", core: ["무역", "글로벌", "영어", "마케팅"], certs: [{ name: "국제무역사", url: "https://license.kita.net" }, { name: "무역영어", url: "https://license.korcham.net" }], portfolio: "해외 시장 조사 보고서, 어학 성적" },
  { name: "공공·행정 직무", core: ["공공정책", "법", "글쓰기", "도시"], certs: [{ name: "한국사능력검정", url: "https://www.historyexam.go.kr" }], portfolio: "정책 제안서, 공공 공모전 수상" },
  { name: "부동산·도시 전문가", core: ["부동산", "도시", "법", "금융투자"], certs: [{ name: "공인중개사", url: Q }], portfolio: "도시·부동산 분석 보고서" },
  { name: "패션·뷰티 MD", core: ["패션", "뷰티", "마케팅", "브랜딩"], certs: [], portfolio: "컬렉션·스타일링 포트폴리오, 상품 기획서" },
  { name: "교육·한국어 교원", core: ["한국어교육", "교육", "언어", "글로벌"], certs: [{ name: "한국어교원자격", url: "https://kteacher.korean.go.kr" }], portfolio: "수업 지도안, 교육봉사 기록" },
  { name: "문화기획·큐레이터", core: ["큐레이션", "역사", "미술", "문화콘텐츠"], certs: [{ name: "학예사", url: "https://www.museum.or.kr" }], portfolio: "전시·행사 기획서" },
  { name: "창업가·서비스 기획자", core: ["창업", "경영전략", "UXUI", "마케팅"], certs: [], portfolio: "MVP·사업계획서, 공모전 수상" },
];

export interface Competency {
  tag: string;
  /** 학점 환산 점수 (전공 1.5배, 비교과 활동은 포인트/40) */
  score: number;
  courses: string[];
}

export function competencies(courses: Course[], activities: Activity[]): Competency[] {
  const map = new Map<string, Competency>();
  const add = (tag: string, score: number, label: string) => {
    const c = map.get(tag) ?? { tag, score: 0, courses: [] };
    c.score += score;
    if (!c.courses.includes(label)) c.courses.push(label);
    map.set(tag, c);
  };
  for (const c of courses) {
    const w = c.trackSlot ? 1.5 : 1;
    for (const t of c.tags) add(t, c.credits * w, c.name);
  }
  for (const a of activities) for (const t of a.tags) add(t, a.points / 40, a.name);
  return [...map.values()].sort((a, b) => b.score - a.score);
}

export interface JobFit {
  job: Job;
  fit: number;
  have: { tag: string; score: number }[];
  missing: string[];
  evidence: string[];
}

/** 직무 적합도 = 핵심 역량 충족도(가중) 85% + 관심사 일치 15% */
export function rankJobs(comp: Competency[], interests: string[]): JobFit[] {
  const byTag = new Map(comp.map((c) => [c.tag, c]));
  return JOBS.map((job) => {
    const weights = job.core.map((_, i) => (i === 0 ? 2 : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let got = 0;
    const have: JobFit["have"] = [];
    const missing: string[] = [];
    job.core.forEach((tag, i) => {
      const s = byTag.get(tag)?.score ?? 0;
      got += Math.min(s / 18, 1) * weights[i]!;
      if (s >= 6) have.push({ tag, score: s });
      else missing.push(tag);
    });
    const interest = job.core.filter((t) => interests.includes(t)).length / job.core.length;
    const fit = Math.round((got / total) * 85 + interest * 15);
    const evidence = job.core.flatMap((t) => byTag.get(t)?.courses ?? []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
    return { job, fit, have, missing, evidence };
  }).sort((a, b) => b.fit - a.fit);
}
