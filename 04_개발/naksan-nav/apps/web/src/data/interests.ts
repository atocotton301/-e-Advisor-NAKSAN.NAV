export interface InterestGroup {
  label: string;
  tags: string[];
}

export const INTEREST_GROUPS: InterestGroup[] = [
  {
    label: "기술",
    tags: ["인공지능", "데이터분석", "웹개발", "앱개발", "게임", "보안", "로봇", "반도체", "클라우드", "메타버스"],
  },
  {
    label: "창작",
    tags: ["디자인", "UXUI", "영상", "애니메이션", "패션", "뷰티", "글쓰기", "미술", "공연예술", "브랜딩"],
  },
  {
    label: "비즈니스·사회",
    tags: ["창업", "마케팅", "금융투자", "회계", "경영전략", "무역", "공공정책", "법", "부동산", "도시"],
  },
  {
    label: "인문·교육",
    tags: ["역사", "언어", "영어", "한국어교육", "문화콘텐츠", "철학", "큐레이션", "교육"],
  },
  {
    label: "라이프",
    tags: ["여행", "환경", "심리", "스포츠", "음식", "봉사", "글로벌"],
  },
];

export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 8;
