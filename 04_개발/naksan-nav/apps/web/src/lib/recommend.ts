export interface Recommendation {
  rank: number;
  matched: string[];
  /** 상위 3개는 금테두리 */
  gold: boolean;
}

/**
 * 관심사 해시태그와 과목 태그의 겹침으로 순위를 매긴다.
 * ai/match 의 적합도 점수(w1·성적 + w2·관심 + w3·진행도)가 붙기 전까지의 단순 버전.
 */
export function rankByInterest<T extends { id: string; tags: string[] }>(
  items: T[],
  interests: string[],
): Map<string, Recommendation> {
  const wanted = new Set(interests);
  const scored = items
    .map((item, order) => ({ item, order, matched: item.tags.filter((t) => wanted.has(t)) }))
    .filter((s) => s.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length || a.order - b.order);

  return new Map(
    scored.map((s, i) => [s.item.id, { rank: i + 1, matched: s.matched, gold: i < 3 }] as const),
  );
}
