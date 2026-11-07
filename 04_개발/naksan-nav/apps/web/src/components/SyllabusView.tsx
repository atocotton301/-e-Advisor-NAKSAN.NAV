import { profIdOf } from "../data/curriculum";
import { useEffect, useMemo, useState } from "react";
import { OFFICIAL_LINKS } from "../data/hansung";
import { JS_COLLECTED_AT } from "../data/jongjeongsi";
import { loadRealSyllabus, type CourseInfo, type LoadedSyllabus, type RealSyllabus, type SyllabusSemester } from "../lib/realSyllabus";
import { buildSyllabus } from "../lib/syllabus";
import type { Course, Professor } from "../types";

/** 종합정보시스템 분반은 몇 학기 개설인지(term)를 함께 갖고 있다. */
type Section = NonNullable<Course["sections"]>[number] & { term?: 1 | 2 };

const GRADING: [keyof NonNullable<RealSyllabus["grading"]>, string][] = [
  ["attendance", "출석"],
  ["midterm", "중간고사"],
  ["final", "기말고사"],
  ["assignment", "과제"],
  ["presentation", "발표"],
  ["attitude", "태도"],
];

const METHOD: Record<string, string> = { t: "이론", pt: "실습", p: "발표", d: "토론" };

const normText = (s?: string) => (s ?? "").replace(/\s+/g, "");

const semesterOf = (section: Section | undefined, course: Course): SyllabusSemester =>
  (section?.term ?? course.term) === 1 ? "2026-1" : "2026-2";

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
  const sections = (course.sections ?? []) as Section[];
  const [picked, setPicked] = useState(0);
  useEffect(() => setPicked(0), [course.id]);
  const section = sections[picked] ?? sections[0];
  const semester = semesterOf(section, course);
  /** null 이면 불러오는 중 */
  const [loaded, setLoaded] = useState<LoadedSyllabus | null>(null);

  useEffect(() => {
    if (!real || !course.code || !section) {
      setLoaded({});
      return;
    }
    let alive = true;
    setLoaded(null);
    loadRealSyllabus(semester, course.code, section.prof).then((r) => alive && setLoaded(r));
    return () => {
      alive = false;
    };
  }, [real, course.code, section, semester]);

  const terms = [...new Set(sections.map((x) => x.term ?? course.term ?? 2))];

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
          {sections.length ? (
            <section>
              <h3>{terms.length > 1 ? "2026-1·2학기" : `2026-${terms[0]}학기`} 개설 분반</h3>
              {sections.length > 1 && <p className="fineprint">분반을 누르면 그 분반 수업계획서를 보여줘요.</p>}
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
                    {sections.map((x, i) => (
                      <tr key={x.sec + x.time + i} className={i === picked ? "is-picked" : ""}>
                        <td>
                          <button
                            type="button"
                            className={`sec-pick ${i === picked ? "is-on" : ""}`}
                            aria-pressed={i === picked}
                            onClick={() => setPicked(i)}
                          >
                            {x.sec}
                          </button>
                        </td>
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
            <p className="syllabus__none">이번 자료에는 개설 분반 정보가 없어요.</p>
          )}

          {loaded === null ? (
            <p className="syllabus__loading">수업계획서를 불러오는 중…</p>
          ) : loaded.syllabus ? (
            <RealSyllabusBody syllabus={loaded.syllabus} info={loaded.info} otherProf={loaded.otherProf} semester={semester} />
          ) : (
            <>
              <CourseInfoBlock info={loaded.info} />
              {course.code && section && <p className="syllabus__none">이 분반은 종합정보시스템에 수업계획서가 아직 없어요.</p>}
            </>
          )}

          <section className="syllabus__links">
            <h3>원문 보기</h3>
            <a href={OFFICIAL_LINKS.timetable} target="_blank" rel="noreferrer">
              종합정보시스템 · 시간표 및 수업계획서 조회
            </a>
            {course.id.startsWith("ai-") && (
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
            ? `과목·분반·수업계획서는 한성대 종합정보시스템 기준이에요(${JS_COLLECTED_AT} 수집). 바뀐 내용은 종합정보시스템에서 확인하세요.`
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

function CourseInfoBlock({ info }: { info?: CourseInfo }) {
  if (!info?.desc) return null;
  return (
    <section>
      <h3>과목 해설</h3>
      <p className="pre">{info.desc}</p>
    </section>
  );
}

interface RealSyllabusBodyProps {
  syllabus: RealSyllabus;
  info?: CourseInfo;
  otherProf?: boolean;
  semester: SyllabusSemester;
}

function RealSyllabusBody({ syllabus: r, info, otherProf, semester }: RealSyllabusBodyProps) {
  const grading = GRADING.map(([key, label]) => ({ label, ratio: r.grading?.[key] ?? 0 })).filter((g) => g.ratio > 0);
  const kinds = [
    r.type?.online && "온라인",
    r.type?.english === "Y" && "영어 강의",
    r.type?.ai === "Y" && "AI 활용",
    r.type?.pbl === "Y" && "PBL",
    r.type?.industry === "Y" && "산업체 참여",
    r.type?.teamTeaching === "Y" && "융합 팀티칭",
  ].filter((k): k is string => !!k);
  const weeks = (r.weeks ?? []).map((w, i) => ({ ...w, n: i + 1 })).filter((w) => w.topic || w.online);

  return (
    <>
      <section className="syllabus__real">
        <h3>
          {semester}학기 수업계획서
          {otherProf && <small> · 같은 과목 다른 분반 계획서예요</small>}
        </h3>
        {info?.en && <p className="syllabus__en">{info.en}</p>}
        {kinds.length > 0 && (
          <div className="syllabus__chips">
            {kinds.map((k) => (
              <span key={k} className="cat">
                {k}
              </span>
            ))}
          </div>
        )}
      </section>

      <dl className="syllabus__facts">
        <div>
          <dt>담당교수</dt>
          <dd>{[r.prof, r.dept].filter(Boolean).join(" · ") || "미정"}</dd>
        </div>
        <div>
          <dt>수업시간·강의실</dt>
          <dd>{r.time || "-"}</dd>
        </div>
        <div>
          <dt>학점·이수구분</dt>
          <dd>{r.credit?.replace("_", " · ") || "-"}</dd>
        </div>
        <div>
          <dt>수강대상</dt>
          <dd>{r.target || "-"}</dd>
        </div>
      </dl>

      {/* 과목 해설과 교과목 개요가 같은 글인 과목이 많아 다를 때만 둘 다 보여준다. */}
      {normText(info?.desc) !== normText(r.overview) && <CourseInfoBlock info={info} />}
      {r.overview && (
        <section>
          <h3>교과목 개요</h3>
          <p className="pre">{r.overview}</p>
        </section>
      )}
      {r.goals && (
        <section>
          <h3>수업 목표</h3>
          <p className="pre">{r.goals}</p>
        </section>
      )}
      {(r.prereq || r.book || r.subbook) && (
        <dl className="syllabus__facts syllabus__facts--plain">
          {r.prereq && (
            <div>
              <dt>선수과목</dt>
              <dd>{r.prereq}</dd>
            </div>
          )}
          {r.book && (
            <div>
              <dt>주교재</dt>
              <dd>{r.book}</dd>
            </div>
          )}
          {r.subbook && (
            <div>
              <dt>부교재·참고문헌</dt>
              <dd>{r.subbook}</dd>
            </div>
          )}
        </dl>
      )}

      {grading.length > 0 && (
        <section>
          <h3>성적 평가</h3>
          <div className="grading">
            {grading.map((g) => (
              <span key={g.label} style={{ flexGrow: g.ratio }}>
                {g.label} {g.ratio}%
              </span>
            ))}
          </div>
        </section>
      )}

      {r.outcomes?.length ? (
        <section>
          <h3>역량 성취기준</h3>
          <ul className="outcomes">
            {r.outcomes.map((o) => (
              <li key={o.goal}>
                <span>{o.goal}</span>
                {o.eval && <em>{o.eval.replace(/\s*\n\s*/g, " · ")}</em>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {weeks.length > 0 && (
        <section>
          <h3>주차별 계획</h3>
          <table className="weeks">
            <tbody>
              {weeks.map((w) => (
                <tr key={w.n}>
                  <th>{w.n}주</th>
                  <td>
                    <span className="pre">{w.topic}</span>
                    {w.online && <small className="weeks__online">사전학습 · {w.online}</small>}
                    {w.m && (
                      <span className="weeks__m">
                        {w.m
                          .split(",")
                          .map((k) => METHOD[k])
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {r.notes && (
        <section>
          <h3>기타 안내</h3>
          <p className="pre">{r.notes}</p>
        </section>
      )}
    </>
  );
}
