// 비교과 후기 (예시 데이터). 꿀지수(부담 없음)·혜자지수(얻는 것 대비 가성비)는 비교과 네비게이터에서 쓰던 기준.
// 크레딧은 앱 안에서만 쓰는 포인트로, 현금 가치가 없다.

export const CREDIT = {
  perReview: 10,
  unlockCost: 5,
} as const;

export interface Review {
  id: string;
  /** 1~5 */
  rating: number;
  honey: number;
  value: number;
  semester: string;
  text: string;
  mine?: boolean;
}

const r = (id: string, rating: number, honey: number, value: number, semester: string, text: string): Review => ({
  id,
  rating,
  honey,
  value,
  semester,
  text,
});

export const SEED_REVIEWS: Record<string, Review[]> = {
  "ex-1": [
    r("rv-1", 4, 5, 4, "2026-1", "트랙 고민 중이라면 추천. 선배들 진로 이야기가 제일 도움이 됐어요. 과제 없음."),
    r("rv-2", 3, 4, 3, "2025-2", "하루 일정이라 부담은 적은데 내용이 조금 일반적이에요."),
  ],
  "ex-3": [
    r("rv-3", 5, 2, 5, "2026-1", "밤샘은 각오해야 하지만 포트폴리오에 바로 쓸 결과물이 남아요. 팀은 미리 짜서 가세요."),
    r("rv-4", 4, 2, 5, "2025-2", "멘토 피드백이 꼼꼼했어요. 포인트도 커서 한 번에 채우기 좋아요."),
    r("rv-5", 4, 3, 4, "2025-1", "주제가 넓어서 아이디어만 좋으면 비전공자도 할 만해요."),
  ],
  "ex-5": [r("rv-6", 4, 4, 3, "2026-1", "원어민 튜터와 주 1회. 출석만 잘 하면 무난해요.")],
  "ex-7": [r("rv-7", 5, 5, 3, "2025-2", "레포트 첨삭 받기 좋아요. 포인트는 적지만 시간 대비 만족도 높음.")],
  "ex-10": [
    r("rv-8", 5, 2, 5, "2026-1", "판다스부터 모델링까지 4주. 과제가 꽤 있지만 실력이 확실히 늘어요."),
    r("rv-9", 4, 3, 4, "2025-2", "수업 진도가 빨라서 파이썬 기초는 미리 보고 가는 걸 추천해요."),
  ],
  "ex-13": [r("rv-10", 4, 2, 4, "2026-1", "문제 난이도가 높아요. 보안 트랙이면 꼭 해보세요.")],
};

export const average = (list: Review[], key: "rating" | "honey" | "value") =>
  list.length ? Math.round((list.reduce((acc, x) => acc + x[key], 0) / list.length) * 10) / 10 : 0;
