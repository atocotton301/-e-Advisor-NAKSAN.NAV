import { EXTRA_RULE, type ExtraRow } from "../lib/extracurricular";
import { REQ, type RequirementStatus } from "../lib/requirements";
import type { Course } from "../types";

export interface Note {
  tone: "warn" | "info" | "good";
  text: string;
}

interface DecisionCheckProps {
  semesterLabel: string;
  grade: number;
  semestersLeft: number;
  courses: Course[];
  extra: ExtraRow;
  status: RequirementStatus;
  hasTrack2: boolean;
  clashCount: number;
  memo: string;
  revisiting: boolean;
  onMemo: (text: string) => void;
  onBack: () => void;
  onDecide: () => void;
}

/** 학기를 확정하기 전에 스스로 점검하게 만드는 체크리스트 */
export function semesterNotes(p: Omit<DecisionCheckProps, "memo" | "onMemo" | "onBack" | "onDecide" | "revisiting" | "semesterLabel">): Note[] {
  const credits = p.courses.reduce((acc, c) => acc + c.credits, 0);
  const notes: Note[] = [];
  if (credits > REQ.baseCreditsPerSemester)
    notes.push({ tone: "warn", text: `${credits}학점은 기준 ${REQ.baseCreditsPerSemester}학점을 넘어요. 직전 학기 평점 3.3 이상 등 초과 신청 조건을 확인하세요.` });
  else if (p.grade <= 3 && credits < 15)
    notes.push({ tone: "warn", text: `${credits}학점이에요. 1~3학년은 15학점 이상 들어야 다음 학기 성적우수장학금 대상이 돼요.` });
  else notes.push({ tone: "good", text: `${credits}학점 · 학기 기준(${REQ.baseCreditsPerSemester}학점) 안이에요.` });

  const left = p.status.totalCredits.need - p.status.totalCredits.have;
  if (left > 0 && p.semestersLeft > 0) {
    const per = Math.ceil(left / p.semestersLeft);
    notes.push({
      tone: per > REQ.baseCreditsPerSemester ? "warn" : "info",
      text: `졸업까지 ${left}학점 남았어요. 남은 ${p.semestersLeft}학기 동안 학기당 평균 ${per}학점이 필요해요.`,
    });
  } else if (left > 0) notes.push({ tone: "warn", text: `마지막 학기인데 졸업학점이 ${left}학점 모자라요.` });

  if (!p.hasTrack2 && p.grade >= 1)
    notes.push({ tone: p.grade >= 2 ? "warn" : "info", text: "제2트랙을 아직 정하지 않았어요. 2학년 진학 전에 트랙 2개를 골라야 해요." });

  if (p.extra.lost > 0) notes.push({ tone: "warn", text: `비교과 ${p.extra.lost}pt가 400pt를 넘어 소멸돼요. 일부 활동을 다음 학기로 옮겨보세요.` });
  else if (p.extra.carryOut > 0)
    notes.push({ tone: "info", text: `비교과 ${p.extra.recognized}pt 인정, ${p.extra.carryOut}pt는 다음 학기로 이월돼요.` });
  else if (REQ.extraPoints > 0 && p.extra.recognized === 0)
    notes.push({ tone: "info", text: `이번 학기 비교과가 없어요. 졸업까지 ${REQ.extraPoints}pt가 필요해요.` });
  else notes.push({ tone: "good", text: `비교과 ${p.extra.recognized}/${EXTRA_RULE.perSemester}pt 인정.` });

  if (p.clashCount > 0) notes.push({ tone: "warn", text: "시간표에 시간이 겹치는 수업이 있어요. 겹치는 과목은 학점으로 인정되지 않아요." });
  return notes;
}

export function DecisionCheck(props: DecisionCheckProps) {
  const notes = semesterNotes(props);
  const credits = props.courses.reduce((acc, c) => acc + c.credits, 0);

  return (
    <div className="decide">
      <header className="tt__head">
        <h2>{props.semesterLabel} 학기, 이렇게 결정할까요?</h2>
        <p>확정하기 전에 한 번 점검해요. 나중에 학기 아이콘을 눌러 언제든 다시 고칠 수 있어요.</p>
      </header>

      <div className="decide__courses">
        {props.courses.length ? (
          props.courses.map((c) => (
            <span key={c.id} className="chip">
              {c.name} · {c.credits}
            </span>
          ))
        ) : (
          <span className="chip">담은 과목 없음</span>
        )}
        <b>{credits}학점</b>
      </div>

      <ul className="decide__notes">
        {notes.map((n) => (
          <li key={n.text} className={`is-${n.tone}`}>
            {n.text}
          </li>
        ))}
      </ul>

      <label className="field">
        <span>이번 학기 결정 메모 (왜 이렇게 정했는지, 다음 학기에 고민할 것)</span>
        <textarea
          id={`decide-memo-${props.semesterLabel}`}
          rows={3}
          value={props.memo}
          onChange={(e) => props.onMemo(e.target.value)}
          placeholder="예) 데이터 분석 쪽 진로를 확인하려고 선형대수를 먼저 들음. 다음 학기엔 제2트랙 후보 2개 비교하기."
        />
      </label>

      <div className="card__actions">
        <button type="button" className="btn btn--ghost" onClick={props.onBack}>
          더 고민할래요
        </button>
        <button type="button" className="btn btn--primary" onClick={props.onDecide}>
          {props.revisiting ? "수정 내용 저장" : "이렇게 결정"}
        </button>
      </div>
    </div>
  );
}
