// 「교외 활동에 대한 비교과포인트 배점표」(2025.12.2.) 기준
// 실제 인정 여부는 스마트자기관리시스템 ▶ 교외비교과활동에서 신청 후 확정된다.

export type ExternalKind = "volunteer" | "cert" | "exam" | "contest" | "paper" | "etc";

export interface ExternalOption {
  label: string;
  points: number;
}

export interface ExternalType {
  kind: ExternalKind;
  name: string;
  /** 학기 인정 상한 */
  cap?: number;
  /** 시간·횟수처럼 개수를 곱하는 항목 */
  unit?: string;
  options: ExternalOption[];
  proof: string;
  note?: string;
}

export const EXTERNAL_TYPES: ExternalType[] = [
  {
    kind: "volunteer",
    name: "교외 봉사",
    cap: 50,
    options: [
      { label: "1365 자원봉사포털 (시간당)", points: 5 },
      { label: "VMS 사회복지자원봉사 (시간당)", points: 5 },
      { label: "헌혈 (회당)", points: 10 },
    ],
    unit: "시간·회",
    proof: "봉사활동 확인서, 헌혈 증서",
    note: "교내 봉사·사회봉사 교과목과 같은 활동은 신청할 수 없어요. 종료일이 속한 학기에 신청해요.",
  },
  {
    kind: "cert",
    name: "자격증",
    options: [
      { label: "국가기술 기술사", points: 100 },
      { label: "국가기술 기능장", points: 80 },
      { label: "국가기술 기사", points: 50 },
      { label: "국가기술 산업기사", points: 40 },
      { label: "국가기술 기능사", points: 30 },
      { label: "국가공인 민간 1급·단일", points: 50 },
      { label: "국가공인 민간 2급", points: 30 },
      { label: "등록 민간 1급·단일", points: 30 },
      { label: "ITQ·MOS (과목당)", points: 10 },
    ],
    proof: "자격증 사본",
    note: "민간자격은 민간자격정보서비스에 등록된 자격만 인정돼요.",
  },
  {
    kind: "exam",
    name: "어학·검정시험",
    options: [
      { label: "TOEIC 850 이상", points: 50 },
      { label: "TOEIC 750 이상", points: 30 },
      { label: "TOEIC 650 이상", points: 10 },
      { label: "OPIc AL", points: 50 },
      { label: "OPIc IH·IM3", points: 30 },
      { label: "TOEIC Speaking AH·AM", points: 50 },
      { label: "한국사능력검정 1급", points: 50 },
      { label: "한국사능력검정 2급", points: 40 },
      { label: "TOPCIT 수준 5", points: 50 },
      { label: "TOPCIT 수준 4", points: 30 },
      { label: "JLPT N1", points: 50 },
      { label: "HSK 6급 이상", points: 50 },
    ],
    proof: "성적표",
    note: "같은 시험은 재학 중 1회 인정, 성적이 오르면 1회 추가 지급돼요.",
  },
  {
    kind: "contest",
    name: "공모전·대회",
    options: [
      { label: "전국·국제 대상", points: 100 },
      { label: "전국·국제 입상", points: 50 },
      { label: "전국·국제 입선", points: 30 },
      { label: "전국·국제 참가", points: 10 },
      { label: "시·도 단위 대상", points: 50 },
      { label: "시·도 단위 입상", points: 30 },
      { label: "시·도 단위 참가", points: 10 },
    ],
    proof: "수상 증빙, 교외수상실적 양식 (지도교수·트랙상담교수 확인 서명)",
  },
  {
    kind: "paper",
    name: "연구논문",
    options: [
      { label: "학술논문 1저자", points: 70 },
      { label: "학술논문 2저자", points: 50 },
      { label: "구술발표 1저자", points: 50 },
      { label: "포스터 1저자", points: 30 },
      { label: "포스터 2저자", points: 20 },
    ],
    proof: "학술대회 안내 포스터, 논문·발표자료, 증빙사진",
  },
  {
    kind: "etc",
    name: "전시회·서포터즈 등",
    cap: 50,
    options: [
      { label: "전시회·공연 관람·참여", points: 10 },
      { label: "서포터즈·홍보단·기자단 수료", points: 10 },
      { label: "교육 수료", points: 10 },
    ],
    proof: "소감문, 입장권(학번·이름 표기) 또는 수료증",
    note: "콘서트·뮤지컬·영화 같은 엔터테인먼트 공연은 인정되지 않아요.",
  },
];

export const EXAM_LINKS = [
  { exam: "TOEIC · TOEIC Speaking", best: "850 이상 · AH/AM 50pt", url: "https://exam.toeic.co.kr" },
  { exam: "OPIc", best: "AL 50pt", url: "https://www.opic.or.kr" },
  { exam: "한국사능력검정시험", best: "1급 50pt", url: "https://www.historyexam.go.kr" },
  { exam: "TOPCIT", best: "수준 5 50pt", url: "https://www.topcit.or.kr" },
  { exam: "국가기술자격 (기사 등)", best: "기술사 100pt · 기사 50pt", url: "https://www.q-net.or.kr" },
  { exam: "민간자격 조회", best: "공인 1급 50pt", url: "https://www.pqi.or.kr" },
];

export interface Opportunity {
  id: string;
  name: string;
  kind: "공모전" | "부트캠프" | "대외활동";
  scope: "교내" | "교외";
  deadline: string;
  tags: string[];
  points: string;
}

/** 기회 레이더 예시 데이터. 실제 버전은 크롤러가 교내 공지·외부 공모전을 모은다. */
export const OPPORTUNITIES: Opportunity[] = [
  { id: "op-1", name: "AI 서비스 아이디어 공모전 (예시)", kind: "공모전", scope: "교외", deadline: "2026-11-28", tags: ["인공지능", "앱개발"], points: "참가 10 · 입상 50pt" },
  { id: "op-2", name: "교내 SW 해커톤 (예시)", kind: "공모전", scope: "교내", deadline: "2026-11-21", tags: ["웹개발", "앱개발"], points: "교내 비교과" },
  { id: "op-3", name: "데이터 분석 겨울 부트캠프 (예시)", kind: "부트캠프", scope: "교외", deadline: "2026-12-05", tags: ["데이터분석", "인공지능"], points: "교육 수료 10pt" },
  { id: "op-4", name: "UX/UI 디자인 챌린지 (예시)", kind: "공모전", scope: "교외", deadline: "2026-12-12", tags: ["UXUI", "디자인"], points: "참가 10 · 입상 50pt" },
  { id: "op-5", name: "공공데이터 활용 경진대회 (예시)", kind: "공모전", scope: "교외", deadline: "2026-12-01", tags: ["데이터분석", "공공정책"], points: "참가 10 · 입상 50pt" },
  { id: "op-6", name: "IT 기업 대학생 서포터즈 (예시)", kind: "대외활동", scope: "교외", deadline: "2026-11-30", tags: ["마케팅", "브랜딩"], points: "수료 10pt" },
  { id: "op-7", name: "정보보안 캠프 (예시)", kind: "부트캠프", scope: "교외", deadline: "2026-12-08", tags: ["보안"], points: "교육 수료 10pt" },
  { id: "op-8", name: "창업 아이템 경진대회 (예시)", kind: "공모전", scope: "교내", deadline: "2026-11-25", tags: ["창업", "마케팅"], points: "교내 비교과" },
];
