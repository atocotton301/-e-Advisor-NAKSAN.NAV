import { useEffect, useState } from "react";
import { briefProfessor, type ProfessorBrief } from "../lib/ai";
import type { Professor } from "../types";

function useTypewriter(text: string, cps = 60) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!text) return;
    const timer = setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), 1000 / cps);
    return () => clearInterval(timer);
  }, [text, cps]);
  return text.slice(0, n);
}

export function ProfessorView({ professor }: { professor: Professor }) {
  if (professor.real) return <RealProfessor professor={professor} />;
  return <SampleProfessor professor={professor} />;
}

/** 책자에 나온 실제 교수님. 연구 정보를 지어내지 않고, 연동 예정이라고만 알린다. */
function RealProfessor({ professor }: { professor: Professor }) {
  return (
    <article className="prof">
      <header className="prof__head">
        <span className="prof__avatar" aria-hidden>
          {professor.name.slice(0, 1)}
        </span>
        <div>
          <span className="eyebrow">{professor.dept}</span>
          <h2>{professor.name} 교수</h2>
        </div>
      </header>
      <section className="prof__ai">
        <span className="ai-badge">연동 예정</span>
        <p className="prof__headline">
          교수님의 최근 논문 요약은 KCI·RISS 논문 정보와 연동한 뒤 제공돼요. 지금은 담당 과목과 분반 정보만 보여드려요.
        </p>
      </section>
    </article>
  );
}

function SampleProfessor({ professor }: { professor: Professor }) {
  const [brief, setBrief] = useState<ProfessorBrief | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setBrief(null);
    briefProfessor(professor, ctrl.signal)
      .then(setBrief)
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) throw e;
      });
    return () => ctrl.abort();
  }, [professor]);

  const headline = useTypewriter(brief?.headline ?? "");

  return (
    <article className="prof">
      <header className="prof__head">
        <span className="prof__avatar" aria-hidden>
          {professor.name.slice(0, 1)}
        </span>
        <div>
          <span className="eyebrow">{professor.dept} · 가상 교수(데모)</span>
          <h2>{professor.name} 교수</h2>
          <p className="prof__focus">#{professor.focus}</p>
        </div>
      </header>

      <section className="prof__ai">
        <span className="ai-badge">AI 요약</span>
        {brief ? (
          <p className="prof__headline">
            {headline}
            {headline.length < brief.headline.length && <span className="caret" />}
          </p>
        ) : (
          <div className="thinking">
            <span>논문 3편을 읽고 있어요</span>
            <span className="dots" />
            <div className="skeleton" />
            <div className="skeleton skeleton--short" />
          </div>
        )}
      </section>

      {brief && (
        <ol className="papers">
          {brief.papers.map((p, i) => (
            <li key={p.title} className="paper" style={{ animationDelay: `${300 + i * 220}ms` }}>
              <span className="paper__no">{i + 1}</span>
              <div>
                <h3>{p.title}</h3>
                <p className="paper__venue">
                  {p.venue} · {p.year}
                </p>
                <p className="paper__plain">{p.plain}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="fineprint">
        논문 목록은 가상 데이터예요. 실제 서비스에서는 KCI·RISS 논문 메타데이터를 모아 AI가 쉬운 말로 요약합니다.
      </p>
    </article>
  );
}
