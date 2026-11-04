import { useState, type FormEvent } from "react";
import type { Admission, AdmissionKind } from "../types";
import { entryYearOf, specFor } from "../lib/requirements";
import { Boogi } from "./Boogi";

const STUDENT_ID = /^\d{7,10}$/;

const KINDS: { kind: AdmissionKind; label: string; desc: string }[] = [
  { kind: "신입학", label: "재학생", desc: "1학년 입학" },
  { kind: "일반편입", label: "일반편입", desc: "2·3학년 편입" },
  { kind: "학사편입", label: "학사편입", desc: "학사 취득 후 편입" },
  { kind: "미래플러스", label: "미래플러스", desc: "성인학습자·재직자" },
  { kind: "대학원", label: "대학원생", desc: "석사·박사" },
  { kind: "평생교육", label: "평생교육", desc: "평생교육 과정" },
];

export function Login({
  onSubmit,
  initialId,
  initialAdmission,
}: {
  onSubmit: (studentId: string, admission: Admission) => void;
  initialId?: string;
  initialAdmission?: Admission;
}) {
  const [kind, setKind] = useState<AdmissionKind>(initialAdmission?.kind ?? "신입학");
  const [tGrade, setTGrade] = useState<2 | 3>(initialAdmission?.transferGrade ?? 3);
  const [studentId, setStudentId] = useState(initialId || "2391234");
  const [password, setPassword] = useState("test");
  const [touched, setTouched] = useState(false);

  const idValid = STUDENT_ID.test(studentId);
  const canSubmit = idValid && password.length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (canSubmit) onSubmit(studentId, { kind, transferGrade: kind === "일반편입" ? tGrade : kind === "학사편입" ? 3 : undefined });
  };

  return (
    <form className="card login" onSubmit={submit} noValidate>
      <div className="brand">
        <Boogi pose="front" variant="wave" scale={3} />
        <div>
          <h1 className="brand__name">NAKSAN.NAV</h1>
          <p className="brand__tagline">Your 4 years, navigated.</p>
        </div>
      </div>

      <fieldset className="kind">
        <legend>나는</legend>
        <div className="kind__grid">
          {KINDS.map((k) => (
            <button key={k.kind} type="button" className={`kind__opt ${kind === k.kind ? "is-on" : ""}`} aria-pressed={kind === k.kind} onClick={() => setKind(k.kind)}>
              <b>{k.label}</b>
              <small>{k.desc}</small>
            </button>
          ))}
        </div>
        {kind === "일반편입" && (
          <div className="kind__sub">
            편입 학년
            {([2, 3] as const).map((g) => (
              <button key={g} type="button" className={`chip ${tGrade === g ? "chip--blue" : ""}`} onClick={() => setTGrade(g)}>
                {g}학년
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <label className="field">
        <span>학번</span>
        <input
          inputMode="numeric"
          autoComplete="username"
          placeholder="예) 2391234"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
          aria-invalid={touched && !idValid}
          autoFocus
        />
      </label>
      {touched && !idValid && <p className="field__error">학번은 숫자 7~10자리예요.</p>}
      {idValid && (
        <p className="login__version">
          <b>{studentId.slice(0, 2)}학번</b> · {entryYearOf(studentId)}학년도 입학 → <b>{specFor(entryYearOf(studentId)).version}</b> 졸업요건으로
          계산해요
        </p>
      )}

      <label className="field">
        <span>비밀번호</span>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="데모 비밀번호: test"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <button type="submit" className="btn btn--primary btn--block" disabled={touched && !canSubmit}>
        시작하기
      </button>
      <p className="fineprint">데모 계정 학번 2391234 · 비밀번호 test 가 미리 입력되어 있어요. 실제 비밀번호는 넣지 마세요. 입력값은 어디에도 전송되지 않아요.</p>
      <p className="fineprint">캐릭터 상상부기 ⓒ 한성대학교 · 사용 허락을 받아 사용했어요.</p>
    </form>
  );
}
