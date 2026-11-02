import { useState, type FormEvent } from "react";
import { Boogi } from "./Boogi";

const STUDENT_ID = /^\d{7,10}$/;

export function Login({ onSubmit }: { onSubmit: (studentId: string) => void }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const idValid = STUDENT_ID.test(studentId);
  const canSubmit = idValid && password.length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (canSubmit) onSubmit(studentId);
  };

  return (
    <form className="card login" onSubmit={submit} noValidate>
      <div className="brand">
        <Boogi pose="front" scale={3} />
        <div>
          <h1 className="brand__name">NAKSAN.NAV</h1>
          <p className="brand__tagline">Your 4 years, navigated.</p>
        </div>
      </div>

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

      <label className="field">
        <span>비밀번호</span>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="종합정보시스템 비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <button type="submit" className="btn btn--primary btn--block" disabled={touched && !canSubmit}>
        시작하기
      </button>
      <p className="fineprint">데모 버전이라 입력값은 어디에도 전송되지 않아요. 실제 서비스는 학교 SSO 연동 예정.</p>
    </form>
  );
}
