// 학기별 수강신청 가능 학점 (2026-2 수강신청 안내 및 학업이수가이드 4·8장)
// - 16학번 이후 6~18학점 (15학번 이전 6~20)
// - 성적우수: 직전 학기 15학점 이상 신청 + 평점 4.0 이상(계절 포함) + F 없음 → 3학점 초과(21)
// - 학사경고(직전 학기 평점 1.75 미만) → 15학점까지
// - 학점이월: 직전 학기 잔여학점(18 − 신청학점)을 최대 3학점까지 다음 학기로 이월, 이월 포함 최대 21(15학번 이전 23)
//   성적우수 추가학점과 중복 불가, 학사경고자 제외, 다음 학기에 안 쓰면 소멸

export interface CreditLimit {
  limit: number;
  base: number;
  carry: number;
  honor: boolean;
  warning: boolean;
  reason: string;
}

export function creditLimit(opts: { base: number; prevCredits: number | null; prevGpa: number | null; prevHasF: boolean }): CreditLimit {
  const { base, prevCredits, prevGpa, prevHasF } = opts;
  const cap = base + 3;
  if (prevCredits === null) return { limit: base, base, carry: 0, honor: false, warning: false, reason: `기본 ${base}학점` };
  if (prevGpa !== null && prevGpa < 1.75)
    return { limit: 15, base, carry: 0, honor: false, warning: true, reason: `직전 학기 학사경고(평점 ${prevGpa.toFixed(2)})라 15학점까지예요` };
  if (prevGpa !== null && prevGpa >= 4.0 && prevCredits >= 15 && !prevHasF)
    return { limit: cap, base, carry: 0, honor: true, warning: false, reason: `직전 학기 평점 ${prevGpa.toFixed(2)} 성적우수 +3학점` };
  const carry = Math.min(3, Math.max(0, base - prevCredits));
  return {
    limit: Math.min(base + carry, cap),
    base,
    carry,
    honor: false,
    warning: false,
    reason: carry ? `직전 학기 ${prevCredits}학점 신청 → 잔여 ${carry}학점 이월` : `기본 ${base}학점 · 직전 학기 평점 4.0 이상이면 21학점`,
  };
}
