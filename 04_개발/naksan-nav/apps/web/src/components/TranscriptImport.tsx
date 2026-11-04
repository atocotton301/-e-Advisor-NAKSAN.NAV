import { useEffect, useState } from "react";
import { gpa, GRADES, type Grade, type TranscriptRow } from "../lib/transcript";

const SEMESTERS = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

export interface ExtraCaptureRow {
  semester: number;
  name: string;
  points: number;
}

type Mode = "grades" | "extra";
type Step = "upload" | "reading" | "review";

interface TranscriptImportProps {
  entryYear: number;
  initialMode?: Mode;
  /** 과목명을 교육과정 과목과 맞춰 id·이수구분을 채운다 */
  matchCourse: (name: string) => { courseId: string; category: TranscriptRow["category"] } | null;
  makeSample: () => TranscriptRow[];
  onApplyGrades: (rows: TranscriptRow[]) => void;
  onApplyExtra: (rows: ExtraCaptureRow[]) => void;
}


export function TranscriptImport({ initialMode = "grades", matchCourse, makeSample, onApplyGrades, onApplyExtra }: TranscriptImportProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<TranscriptRow[]>([]);
  const [extras, setExtras] = useState<ExtraCaptureRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(0);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);





  // 데모에서는 이미지를 실제로 읽지 않는다. 실제 버전은 팀 서버의 OCR(ai/ocr)이 읽는다.
  const read = (file: File | undefined, demo = false) => {
    if (!file && !demo) return;
    setError(null);
    setFileName(file?.name ?? "샘플 성적표");
    setPreview(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    setStep("reading");
    window.setTimeout(() => {
      if (mode === "grades" || demo) {
        setRows(makeSample());
        setMode("grades");
      } else {
        setExtras([
          { semester: 0, name: "상상력 진로캠프 (예시)", points: 40 },
          { semester: 1, name: "SW 해커톤 (예시)", points: 100 },
        ]);
      }
      setSkipped(0);
      setStep("review");
    }, 1200);
  };

  const startManual = () => {
    setRows([]);
    setMode("grades");
    setStep("review");
  };
  const [draft, setDraft] = useState({ semester: 0, name: "", credits: 3, grade: "A0" as Grade });
  const addDraft = () => {
    if (!draft.name.trim()) return;
    const m = matchCourse(draft.name);
    setRows((prev) => [
      ...prev,
      {
        semester: draft.semester,
        courseId: m?.courseId ?? `man-${Date.now()}-${draft.name}`,
        name: draft.name.trim(),
        category: m?.category ?? "일반선택",
        credits: draft.credits,
        grade: draft.grade,
      },
    ]);
    setDraft((d) => ({ ...d, name: "" }));
  };

  const setGrade = (i: number, grade: Grade) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, grade } : r)));
  const total = rows.reduce((acc, r) => acc + r.credits, 0);
  const avg = gpa(rows);

  return (
    <div className="ts">
      <header className="tt__head">
        <h2>캡처로 입력</h2>
        <p>종합정보시스템 성적 조회나 비교과 이수 내역 화면을 캡처해서 올리면 로드맵·졸업요건·내 페이지에 바로 반영돼요.</p>
      </header>

      {step === "upload" && (
        <>
          <div className="course-panel__tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "grades"} className={`tab ${mode === "grades" ? "is-active" : ""}`} onClick={() => setMode("grades")}>
              성적표
            </button>
            <button type="button" role="tab" aria-selected={mode === "extra"} className={`tab ${mode === "extra" ? "is-active" : ""}`} onClick={() => setMode("extra")}>
              비교과 내역
            </button>
          </div>
          <label
            className="ts__drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              read(e.dataTransfer.files[0]);
            }}
          >
            <input id="ts-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => read(e.target.files?.[0])} />
            <b>{mode === "grades" ? "성적 조회 화면 캡처 올리기" : "비교과 이수 내역 캡처 올리기"}</b>
            <span>PNG · JPG를 끌어다 놓거나 눌러서 고르세요</span>
            <span className="ts__warn">데모에서는 이미지를 실제로 읽지 않고 예시 결과로 보여줘요.</span>
            {mode === "grades" && (
              <button type="button" className="link-btn" onClick={(e) => (e.preventDefault(), read(undefined, true))}>
                캡처 없이 샘플로 해보기
              </button>
            )}
          </label>
          {mode === "grades" && (
            <button type="button" className="btn btn--ghost btn--block" onClick={startManual}>
              성적 직접 입력하기
            </button>
          )}
          {error && <p className="field__error">{error}</p>}
        </>
      )}

      {step === "reading" && (
        <div className="ts__reading">
          {preview && <img src={preview} alt="올린 캡처" />}
          <div className="ts__scan" aria-live="polite">
            <span className="ts__spinner" />
            <b>{fileName}</b>
            <span>{mode === "grades" ? "과목명·학점·성적을 읽는 중…" : "활동명·포인트를 읽는 중…"}</span>
          </div>
        </div>
      )}

      {step === "review" && mode === "grades" && (
        <>
          <p className="ts__summary">
            <b>{rows.length}과목</b> · {total}학점 · 평점평균 <b>{avg?.toFixed(2) ?? "—"}</b> / 4.5
            <span>
              읽은 결과가 맞는지 확인하고, 틀린 성적은 바로 고쳐 주세요.
              {skipped > 0 && ` 학기를 알 수 없거나 계절학기인 ${skipped}개 행은 건너뛰었어요.`}
            </span>
          </p>
          <div className="ts__add">
            <select id="ts-add-sem" aria-label="학기" value={draft.semester} onChange={(e) => setDraft({ ...draft, semester: Number(e.target.value) })}>
              {SEMESTERS.map((l, i) => (
                <option key={l} value={i}>
                  {l}
                </option>
              ))}
            </select>
            <input id="ts-add-name" aria-label="과목명" placeholder="과목명" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addDraft()} />
            <input id="ts-add-cr" aria-label="학점" type="number" min={1} max={6} value={draft.credits} onChange={(e) => setDraft({ ...draft, credits: Number(e.target.value) || 3 })} />
            <select id="ts-add-grade" aria-label="성적" value={draft.grade} onChange={(e) => setDraft({ ...draft, grade: e.target.value as Grade })}>
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <button type="button" className="btn btn--ghost btn--sm" onClick={addDraft}>
              과목 추가
            </button>
          </div>
          <div className="ts__table">
            <table>
              <thead>
                <tr>
                  <th>학기</th>
                  <th>과목명</th>
                  <th>이수구분</th>
                  <th>학점</th>
                  <th>성적</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.courseId + i}>
                    <td>{SEMESTERS[r.semester]}</td>
                    <td>{r.name}</td>
                    <td>{r.category}</td>
                    <td>{r.credits}</td>
                    <td>
                      <select id={`ts-grade-${i}`} aria-label={`${r.name} 성적`} value={r.grade} onChange={(e) => setGrade(i, e.target.value as Grade)}>
                        {GRADES.map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setStep("upload")}>
              다시 올리기
            </button>
            <button type="button" className="btn btn--primary" onClick={() => onApplyGrades(rows)}>
              로드맵에 반영하기
            </button>
          </div>
        </>
      )}

      {step === "review" && mode === "extra" && (
        <>
          <p className="ts__summary">
            <b>{extras.length}개 활동</b> · {extras.reduce((a, r) => a + r.points, 0)}pt
            <span>{skipped > 0 && `학기를 알 수 없는 ${skipped}개 행은 건너뛰었어요. `}학기별 200pt 인정·이월 규칙으로 다시 계산돼요.</span>
          </p>
          <div className="ts__table">
            <table>
              <thead>
                <tr>
                  <th>학기</th>
                  <th>활동</th>
                  <th>포인트</th>
                </tr>
              </thead>
              <tbody>
                {extras.map((r, i) => (
                  <tr key={r.name + i}>
                    <td>{SEMESTERS[r.semester]}</td>
                    <td>{r.name}</td>
                    <td>{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setStep("upload")}>
              다시 올리기
            </button>
            <button type="button" className="btn btn--primary" onClick={() => onApplyExtra(extras)}>
              비교과에 반영하기
            </button>
          </div>
        </>
      )}

      <div className="ts__notes">
        <p>
          <b>데모 안내</b> 지금은 캡처를 실제로 읽지 않고 예시 결과를 채워요. 성적은 직접 입력할 수도 있어요. 실제 버전은 팀 서버의
          OCR이 캡처 속 표를 읽고, 과목명을 교육과정과 맞춰 이수구분을 붙여요.
        </p>
        <p>
          <b>앞으로의 연동 계획</b> 학교 SSO 로그인과 한성대 종합정보시스템 성적·이수내역 연동이 가능해지면 캡처 없이 로그인만으로 자동
          반영돼요. 학생 동의를 받아 필요한 항목만 가져오도록 담당 부서와 협의할 예정이에요.
        </p>
      </div>
    </div>
  );
}
