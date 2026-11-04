import { useState } from "react";
import { OFFICIAL_LINKS } from "../data/hansung";
import { buildCalendar, graduationOf, LEAVE_KINDS, leaveWarnings, STUDY_LABELS, type Leave, type LeaveKind } from "../lib/leave";
import { REQ, type Progress, type RequirementStatus } from "../lib/requirements";
import type { Student } from "../types";

interface GraduationPlanProps {
  student: Student;
  leaves: Leave[];
  onChangeLeaves: (leaves: Leave[]) => void;
  /** 지금까지 진행한 학기 (0 = 1-1) */
  reached: number;
  /** 8학기 계획 전체로 본 졸업요건 */
  planned: RequirementStatus;
  gpa: number | null;
}

const ok = (p: Progress) => p.have >= p.need;

export function GraduationPlan({ student, leaves, onChangeLeaves, reached, planned, gpa }: GraduationPlanProps) {
  const [draft, setDraft] = useState<{ kind: LeaveKind; before: number; semesters: number }>({ kind: "일반", before: 2, semesters: 2 });
  const cal = buildCalendar(student.entryYear, leaves);
  const grad = graduationOf(cal);
  const noLeave = graduationOf(buildCalendar(student.entryYear, []));
  const warnings = leaveWarnings(student.entryYear, leaves);
  const nowCal = cal.find((c) => c.study === reached)!;

  // 졸업 · 수료 판정 (계획 8학기 기준)
  const credits = ok(planned.totalCredits);
  const majorOk =
    ok(planned.track1.basic) && ok(planned.track1.required) && ok(planned.track1.total) &&
    (!planned.track2 || (ok(planned.track2.basic) && ok(planned.track2.required) && ok(planned.track2.total)));
  const liberalOk = ok(planned.liberalBasicTotal) && ok(planned.areaCount) && ok(planned.areaCredits);
  const extraOk = REQ.extraPoints === 0 || ok(planned.extraPoints);
  const gpaOk = gpa === null || gpa >= 2.0;
  const outcome = !credits && reached < STUDY_LABELS.length - 1
    ? { key: "plan", title: "아직 설계 중", text: `지금까지 계획한 학점은 ${planned.totalCredits.have}/${planned.totalCredits.need}학점이에요. 남은 학기를 설계하면 졸업·수료 여부를 판정해 드려요.` }
    : !credits
    ? { key: "short", title: "학점 부족 · 초과학기 필요", text: `계획대로면 ${planned.totalCredits.have}/${planned.totalCredits.need}학점이라 8학기 안에 졸업학점을 못 채워요. 9학기째(학기초과자)를 등록해야 해요.` }
    : majorOk && liberalOk && extraOk && gpaOk
      ? { key: "grad", title: "졸업 예상", text: `계획대로 이수하면 ${grad.label} 대상이에요.` }
      : {
          key: "done",
          title: "수료 예상",
          text: `졸업학점은 채우지만 ${[!majorOk && "전공 영역", !liberalOk && "교양 영역", !extraOk && `비교과 ${REQ.extraPoints}pt`, !gpaOk && "평점 2.0"].filter(Boolean).join(", ")} 기준을 못 채워 수료로 처리될 수 있어요.`,
        };

  const add = () => {
    onChangeLeaves([...leaves, { id: `lv-${Date.now()}`, ...draft }]);
  };

  const isFinal = reached === STUDY_LABELS.length - 1;
  const myCert = isFinal ? "졸업예정증명서" : "재학증명서";

  return (
    <div className="grad">
      <header className="tt__head">
        <h2>휴학 · 졸업 시기</h2>
        <p>
          휴학 계획을 넣으면 몇 년도 몇 월에 졸업하는지 바로 계산해요. {student.entryYear}학년도 입학 · 지금 {STUDY_LABELS[reached]}(
          {nowCal.year}년 {nowCal.term}학기)
        </p>
      </header>

      <div className={`grad__hero grad__hero--${outcome.key}`}>
        <span>예상 졸업</span>
        <b>{grad.label}</b>
        <small>
          {leaves.length ? `휴학 없이 다니면 ${noLeave.label}` : "휴학 계획 없음"} · 학위수여는 매년 2월(전기)·8월(후기)
        </small>
      </div>

      <section className="grad__sec">
        <h3>휴학 계획</h3>
        <div className="grad__add">
          <select aria-label="휴학 종류" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as LeaveKind })}>
            {LEAVE_KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.kind}휴학
              </option>
            ))}
          </select>
          <select aria-label="시기" value={draft.before} onChange={(e) => setDraft({ ...draft, before: Number(e.target.value) })}>
            {STUDY_LABELS.map((l, i) => (
              <option key={l} value={i}>
                {i === 0 ? "입학 직후 (1-1 전)" : `${STUDY_LABELS[i - 1]} 마치고`}
              </option>
            ))}
          </select>
          <select aria-label="기간" value={draft.semesters} onChange={(e) => setDraft({ ...draft, semesters: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}학기{n === 4 ? " (군 복무 보통)" : ""}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn--primary btn--sm" onClick={add}>
            휴학 추가
          </button>
        </div>
        <p className="grad__hint">{LEAVE_KINDS.find((k) => k.kind === draft.kind)!.note}</p>
        {leaves.length > 0 && (
          <ul className="grad__leaves">
            {leaves.map((l) => (
              <li key={l.id}>
                <b>{l.kind}휴학</b> {l.before === 0 ? "입학 직후" : `${STUDY_LABELS[l.before - 1]} 마치고`} {l.semesters}학기
                <button type="button" className="link-btn" onClick={() => onChangeLeaves(leaves.filter((x) => x.id !== l.id))}>
                  빼기
                </button>
              </li>
            ))}
          </ul>
        )}
        {warnings.map((w) => (
          <p key={w} className="field__error">
            {w}
          </p>
        ))}
      </section>

      <section className="grad__sec">
        <h3>학기 달력</h3>
        <ol className="grad__cal">
          {cal.map((c, i) => (
            <li key={i} className={`${c.leave ? "is-leave" : ""} ${c.study === reached ? "is-now" : ""}`}>
              <small>
                {c.year}.{c.term === 1 ? "1학기" : "2학기"}
              </small>
              <b>{c.leave ? `${c.leave}휴학` : STUDY_LABELS[c.study!]}</b>
            </li>
          ))}
          <li className="is-grad">
            <small>
              {grad.year}.{grad.month}월
            </small>
            <b>졸업</b>
          </li>
        </ol>
      </section>

      <section className="grad__sec">
        <h3>졸업 · 수료 · 졸업예정 — 나는 어디에 해당할까?</h3>
        <div className={`grad__verdict grad__verdict--${outcome.key}`}>
          <b>{outcome.title}</b>
          <p>{outcome.text}</p>
          <p>
            지금 발급할 수 있는 증명서: <b>{myCert}</b>
            {!isFinal && ` · 졸업예정증명서는 마지막 학기(4-2, ${cal.find((c) => c.study === 7)!.year}년 ${cal.find((c) => c.study === 7)!.term}학기)를 등록하면 대상이에요.`}
          </p>
        </div>
        <table className="grad__table">
          <thead>
            <tr>
              <th>구분</th>
              <th>발급 기준</th>
            </tr>
          </thead>
          <tbody>
            <tr className={outcome.key === "grad" ? "is-mine" : ""}>
              <th>졸업증명서</th>
              <td>
                졸업학점 {REQ.totalCredits}학점, 전체 평점평균 2.0 이상, 교양·전공 영역별 최소 학점, 학부(트랙) 졸업요건
                {REQ.extraPoints ? `, 비교과 ${REQ.extraPoints}pt` : ""}를 모두 충족하고 졸업사정을 통과해 학위를 받은 뒤(2월·8월)
              </td>
            </tr>
            <tr className={outcome.key === "done" ? "is-mine" : ""}>
              <th>수료증명서</th>
              <td>교과 이수학점은 채웠지만 비교과 포인트나 학과 졸업요건을 못 채워 수료 처리된 경우 (16학번 이후)</td>
            </tr>
            <tr className={isFinal ? "is-mine" : ""}>
              <th>졸업예정증명서</th>
              <td>
                졸업 예정 학기를 등록한 재학생. 재학생은 무료예요. 정확한 발급 시작 시점은 글로벌원스톱센터(02-760-8000)에서 확인하세요.
              </td>
            </tr>
            <tr>
              <th>재학 · 휴학증명서</th>
              <td>재학 중이면 재학증명서, 휴학 중이면 휴학증명서</td>
            </tr>
          </tbody>
        </table>
        <p className="grad__hint">
          졸업 학기 기준: 졸업학점을 다 채웠어도 미등록(휴학 포함) 상태에서는 졸업심사를 받을 수 없어요. 졸업 요건을 다 채운 뒤 졸업을 미루려면
          학사학위취득 유예를 신청해요. 휴학 중 비교과는 교내 인정 프로그램만 학기당 200pt까지 인정돼요.
        </p>
      </section>

      <section className="grad__sec">
        <h3>바로가기</h3>
        <div className="mypage__links">
          <a href={OFFICIAL_LINKS.certificateOnline} target="_blank" rel="noreferrer">
            인터넷 증명발급 (바로 떼기)
          </a>
          <a href={OFFICIAL_LINKS.certificate} target="_blank" rel="noreferrer">
            증명서 발급 안내
          </a>
          <a href={OFFICIAL_LINKS.leave} target="_blank" rel="noreferrer">
            휴·복학 안내
          </a>
          <a href={OFFICIAL_LINKS.graduation} target="_blank" rel="noreferrer">
            졸업 요건 안내
          </a>
          <a href={OFFICIAL_LINKS.gov24} target="_blank" rel="noreferrer">
            정부24 (FAX 민원)
          </a>
        </div>
        <p className="grad__hint">
          인터넷 증명발급은 종합정보시스템과 같은 학번·비밀번호로 로그인해요. 발급 수수료(재학생 500원, 졸업생 1,000원)와 대행 수수료가 붙어요. 상상관 1층
          자동발급기(09:00~22:00)에서도 뗄 수 있어요.
        </p>
      </section>
    </div>
  );
}
