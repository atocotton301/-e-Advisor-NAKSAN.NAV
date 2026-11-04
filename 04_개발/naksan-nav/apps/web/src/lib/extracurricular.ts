// 한성대 비교과 포인트 인정 방식
// - 한 학기에 200pt까지 인정
// - 한 학기에 201~400pt를 모으면 200pt를 뺀 차액을 다음 학기로 이월
// - 400pt를 넘는 부분은 소멸
// 이월받은 포인트도 그 학기 포인트에 더해 같은 규칙으로 계산한다.

export const EXTRA_RULE = {
  perSemester: 200,
  carryLimit: 400,
} as const;

export interface ExtraRow {
  /** 이번 학기에 새로 모은 포인트 */
  earned: number;
  /** 지난 학기에서 이월받은 포인트 */
  carryIn: number;
  /** 이번 학기 인정 포인트 (최대 200) */
  recognized: number;
  /** 다음 학기로 이월되는 포인트 (최대 200) */
  carryOut: number;
  /** 400pt를 넘어 소멸된 포인트 */
  lost: number;
}

export function extraLedger(earnedPerSemester: number[]): ExtraRow[] {
  const rows: ExtraRow[] = [];
  let carry = 0;
  for (const earned of earnedPerSemester) {
    const pool = earned + carry;
    const recognized = Math.min(pool, EXTRA_RULE.perSemester);
    const carryOut = Math.min(Math.max(pool - EXTRA_RULE.perSemester, 0), EXTRA_RULE.carryLimit - EXTRA_RULE.perSemester);
    const lost = Math.max(pool - EXTRA_RULE.carryLimit, 0);
    rows.push({ earned, carryIn: carry, recognized, carryOut, lost });
    carry = carryOut;
  }
  return rows;
}

export const recognizedTotal = (rows: ExtraRow[]) => rows.reduce((acc, r) => acc + r.recognized, 0);
