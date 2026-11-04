import { useMemo } from "react";
import { fieldScores, rankTracks, semesterGpas, WEIGHTS, type TakenCourse } from "../lib/analysis";
import { REQ, type RequirementStatus } from "../lib/requirements";
import type { Student, TrackRef } from "../types";

const SEMESTERS = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

interface AcademicAnalysisProps {
  student: Student;
  taken: TakenCourse[];
  reached: number;
  status: RequirementStatus;
  onPickTrack2: (ref: TrackRef) => void;
  onOpenCapture: () => void;
}

const pct = (v: number) => `${Math.round(v * 100)}`;

export function AcademicAnalysis({ student, taken, reached, status, onPickTrack2, onOpenCapture }: AcademicAnalysisProps) {
  const sems = useMemo(() => semesterGpas(taken, reached), [taken, reached]);
  const fields = useMemo(() => fieldScores(taken), [taken]);
  const fits = useMemo(
    () => rankTracks(taken, student.interests, [student.track1.track.id, student.track2?.track.id ?? ""]).slice(0, 3),
    [taken, student],
  );
  const hasGrades = sems.some((s) => s.gpa !== null);
  const semestersLeft = Math.max(SEMESTERS.length - 1 - reached, 0);
  const creditsLeft = Math.max(status.totalCredits.need - status.totalCredits.have, 0);
  const extraLeft = Math.max(status.extraPoints.need - status.extraPoints.have, 0);
  const maxGpa = 4.5;

  return (
    <div className="ana">
      <header className="tt__head">
        <h2>학업 분석</h2>
        <p>성적표, 학기별 수강 기록, 관심사를 함께 분석해서 강점 분야와 나에게 맞는 트랙을 찾아요.</p>
      </header>

      {!hasGrades && (
        <div className="ana__empty">
          <span>아직 성적이 없어서 관심사와 수강 계획만으로 분석했어요. 성적표를 넣으면 성적 적합도까지 반영돼요.</span>
          <button type="button" className="btn btn--primary btn--sm" onClick={onOpenCapture}>
            성적표 캡처로 넣기
          </button>
        </div>
      )}

      <section className="ana__sec">
        <h3>학기별 평점 추이</h3>
        <div className="ana__bars" role="img" aria-label="학기별 평점">
          {sems.map((s) => (
            <div key={s.semester} className="ana__bar">
              <span className="ana__val">{s.gpa?.toFixed(2) ?? "—"}</span>
              <span className="ana__col">
                <span style={{ height: `${((s.gpa ?? 0) / maxGpa) * 100}%` }} className={s.gpa === null ? "is-empty" : ""} />
              </span>
              <span className="ana__lab">{SEMESTERS[s.semester]}</span>
              <small>{s.credits}학점</small>
            </div>
          ))}
        </div>
      </section>

      <section className="ana__sec">
        <h3>분야별 성적 · 강점과 보완점</h3>
        {fields.length ? (
          <ul className="ana__fields">
            {fields.slice(0, 6).map((f, i) => (
              <li key={f.tag}>
                <span>#{f.tag}</span>
                <span className="ana__meter">
                  <span style={{ width: `${(f.gpa / maxGpa) * 100}%` }} className={i === 0 ? "is-top" : ""} />
                </span>
                <b>{f.gpa.toFixed(2)}</b>
                <small>{f.credits}학점</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="reqs__note">성적이 있는 과목이 3학점 이상 쌓이면 분야별 평점을 보여줘요.</p>
        )}
        {fields.length >= 2 && (
          <p className="ana__insight">
            <b>#{fields[0]!.tag}</b> 분야 성적이 가장 좋아요({fields[0]!.gpa.toFixed(2)}).{" "}
            {fields[fields.length - 1]!.gpa < fields[0]!.gpa - 0.5 &&
              `#${fields[fields.length - 1]!.tag} 분야는 ${fields[fields.length - 1]!.gpa.toFixed(2)}로 보완이 필요해요.`}
          </p>
        )}
      </section>

      <section className="ana__sec">
        <h3>{student.track2 ? "다른 트랙 추천" : "제2트랙 추천"} · 적합도 Top 3</h3>
        <ol className="ana__fits">
          {fits.map((f, i) => (
            <li key={f.ref.track.id}>
              <div className="ana__fit-head">
                <span className="ana__rank">{i + 1}</span>
                <div>
                  <b>{f.ref.track.name}</b>
                  <span>
                    {f.ref.college} · {f.ref.unit}
                  </span>
                </div>
                <strong>{f.score}점</strong>
              </div>
              <div className="ana__parts">
                <span>
                  성적 {pct(f.grade)}
                  {f.gradeNeutral && "(중립)"}
                </span>
                <span>관심 {pct(f.interest)}</span>
                <span>진행 {pct(f.progress)}</span>
              </div>
              {f.reasons.length > 0 && <p>{f.reasons.join(" · ")}</p>}
              {!student.track2 && (
                <button type="button" className="link-btn" onClick={() => onPickTrack2(f.ref)}>
                  제2트랙으로 고르기 →
                </button>
              )}
            </li>
          ))}
        </ol>
        <p className="reqs__note">
          적합도 = 성적 적합도 × {WEIGHTS.grade} + 관심 적합도 × {WEIGHTS.interest} + 진행도 × {WEIGHTS.progress}. 성적 적합도는 그 트랙 분야와
          겹치는 과목의 평점, 관심 적합도는 내 관심사가 트랙 과목에 나오는 비율, 진행도는 이미 인정되는 전공 학점 비율이에요.
        </p>
      </section>

      <section className="ana__sec">
        <h3>졸업 페이스</h3>
        <ul className="ana__pace">
          <li>
            졸업학점 {creditsLeft}학점 남음
            {semestersLeft > 0 && ` · 남은 ${semestersLeft}학기 학기당 평균 ${Math.ceil(creditsLeft / semestersLeft)}학점`}
          </li>
          {REQ.extraPoints > 0 && (
            <li>
              비교과 {extraLeft}pt 남음
              {semestersLeft > 0 && ` · 학기당 ${Math.ceil(extraLeft / semestersLeft)}pt (한 학기 인정 최대 200pt)`}
            </li>
          )}
          <li>{student.track2 ? `제2트랙 ${student.track2.track.name}` : "제2트랙 미선택 · 위 추천을 참고해 2학년 전에 정해요"}</li>
        </ul>
      </section>
    </div>
  );
}
