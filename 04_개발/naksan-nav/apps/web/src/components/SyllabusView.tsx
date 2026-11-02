import { useMemo } from "react";
import { buildSyllabus } from "../lib/syllabus";
import type { Course, Professor } from "../types";

interface SyllabusViewProps {
  course: Course;
  professor?: Professor;
  selected: boolean;
  selectable: boolean;
  onToggle: () => void;
  onOpenProfessor: (id: string, origin: DOMRect) => void;
}

export function SyllabusView({ course, professor, selected, selectable, onToggle, onOpenProfessor }: SyllabusViewProps) {
  const s = useMemo(() => buildSyllabus(course), [course]);

  return (
    <article className="syllabus">
      <header className="syllabus__head">
        <span className="eyebrow">수업계획서 · 2026-2학기</span>
        <h2>{course.name}</h2>
        <div className="syllabus__chips">
          <span className={`cat cat--${course.category}`}>{course.category}</span>
          <span className="cat">{course.credits}학점</span>
          {course.grade > 0 && <span className="cat">{course.grade}학년</span>}
          {course.tags.map((t) => (
            <span key={t} className="cat cat--tag">
              #{t}
            </span>
          ))}
        </div>
      </header>

      <dl className="syllabus__facts">
        <div>
          <dt>담당교수</dt>
          <dd>
            {professor ? (
              <button
                type="button"
                className="prof-link"
                onClick={(e) => onOpenProfessor(professor.id, e.currentTarget.getBoundingClientRect())}
              >
                {professor.name} 교수 <span>AI 논문 요약 →</span>
              </button>
            ) : (
              "미정"
            )}
          </dd>
        </div>
        <div>
          <dt>강의시간</dt>
          <dd>{s.schedule}</dd>
        </div>
        <div>
          <dt>강의실</dt>
          <dd>{s.room}</dd>
        </div>
        <div>
          <dt>수업방식</dt>
          <dd>{s.method}</dd>
        </div>
      </dl>

      <section>
        <h3>수업 개요</h3>
        <p>{s.overview}</p>
      </section>

      <section>
        <h3>학습 목표</h3>
        <ol>
          {s.goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ol>
      </section>

      <section>
        <h3>주차별 계획</h3>
        <table className="weeks">
          <tbody>
            {s.weeks.map((w) => (
              <tr key={w.week}>
                <th>{w.week}</th>
                <td>{w.topic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>평가 방법</h3>
        <div className="grading">
          {s.grading.map((g) => (
            <span key={g.label} style={{ flexGrow: g.ratio }}>
              {g.label} {g.ratio}%
            </span>
          ))}
        </div>
      </section>

      <footer className="syllabus__foot">
        <span className="fineprint">데모용 예시 계획서입니다. 실제 내용은 종합정보시스템 수업계획서를 따릅니다.</span>
        {selectable && (
          <button type="button" className={`btn ${selected ? "btn--ghost" : "btn--primary"}`} onClick={onToggle}>
            {selected ? "이번 학기에서 빼기" : "이번 학기에 담기"}
          </button>
        )}
      </footer>
    </article>
  );
}
