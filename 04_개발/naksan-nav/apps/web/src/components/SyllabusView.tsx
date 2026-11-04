import { profIdOf } from "../data/curriculum";
import { useMemo } from "react";
import { OFFICIAL_LINKS } from "../data/hansung";
import { buildSyllabus } from "../lib/syllabus";
import type { Course, Professor } from "../types";

interface SyllabusViewProps {
  course: Course;
  professor?: Professor;
  selected: boolean;
  selectable: boolean;
  onToggle: () => void;
  onOpenProfessor: (id: string, origin: DOMRect) => void;
  /** 분반 교수 id → 교수 정보가 있는지 */
  hasProfessor?: (id: string) => boolean;
}

export function SyllabusView({ course, professor, selected, selectable, onToggle, onOpenProfessor, hasProfessor }: SyllabusViewProps) {
  const s = useMemo(() => buildSyllabus(course), [course]);
  const real = course.source === "official" || course.source === "book";

  return (
    <article className="syllabus">
      <header className="syllabus__head">
        <span className="eyebrow">{real ? `과목 정보 · ${course.code ?? "한성대 교육과정"}` : "수업계획서 · 샘플"}</span>
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

      {real ? (
        <>
          {course.sections?.length ? (
            <section>
              <h3>2026-2학기 개설 분반</h3>
              <div className="ts__table">
                <table>
                  <thead>
                    <tr>
                      <th>분반</th>
                      <th>교수</th>
                      <th>요일·교시</th>
                      <th>강의실</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.sections.map((x) => (
                      <tr key={x.sec + x.time}>
                        <td>{x.sec}</td>
                        <td>
                          {profIdOf(x.prof) && (hasProfessor?.(profIdOf(x.prof)) ?? !!professor) ? (
                            <button
                              type="button"
                              className="link-btn"
                              onClick={(e) => onOpenProfessor(profIdOf(x.prof), e.currentTarget.getBoundingClientRect())}
                            >
                              {x.prof}
                            </button>
                          ) : (
                            x.prof || "미정"
                          )}
                        </td>
                        <td>{x.time}</td>
                        <td>{x.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <p className="syllabus__none">
              {course.term === 1 ? "1학기 개설 과목이에요. 분반·시간은 1학기 수강신청책자가 들어오면 채워져요." : "이번 책자에는 개설 분반 정보가 없어요."}
            </p>
          )}
          <section className="syllabus__links">
            <h3>원문 보기</h3>
            <a href={OFFICIAL_LINKS.timetable} target="_blank" rel="noreferrer">
              종합정보시스템 · 시간표 및 수업계획서 조회
            </a>
            {course.source === "official" && (
              <a href={OFFICIAL_LINKS.curriculumAI} target="_blank" rel="noreferrer">
                AI응용학과 교육과정소개 (한성대 홈페이지)
              </a>
            )}
            <a href={OFFICIAL_LINKS.curriculum} target="_blank" rel="noreferrer">
              한성대 교육과정 안내
            </a>
          </section>
        </>
      ) : (
        <>
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
        </>
      )}

      <footer className="syllabus__foot">
        <span className="fineprint">
          {real
            ? "과목·분반 정보는 한성대 교육과정과 2026-2 수강신청책자 기준이에요. 수업계획서 원문은 종합정보시스템에서 확인하세요."
            : "샘플 과목의 예시 계획서예요. 실제 내용은 종합정보시스템 수업계획서를 따릅니다."}
        </span>
        {selectable && (
          <button type="button" className={`btn ${selected ? "btn--ghost" : "btn--primary"}`} onClick={onToggle}>
            {selected ? "이번 학기에서 빼기" : "이번 학기에 담기"}
          </button>
        )}
      </footer>
    </article>
  );
}
