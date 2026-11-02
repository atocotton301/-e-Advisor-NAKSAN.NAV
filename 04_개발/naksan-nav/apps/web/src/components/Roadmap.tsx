import { useCallback, useMemo, useRef, useState } from "react";
import { evaluate, isMet, REQ, requirementVersion } from "../lib/requirements";
import type { Catalog, Course, SemesterPlan, Student, TrackRef } from "../types";
import { Boogi } from "./Boogi";
import { CoursePanel } from "./CoursePanel";
import { Genie } from "./Genie";
import { MajorPicker } from "./MajorPicker";
import { ProfessorView } from "./ProfessorView";
import { RequirementsPanel } from "./RequirementsPanel";
import { SyllabusView } from "./SyllabusView";

const SEMESTERS = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];
const EXTEND_MS = 700;

/** 타임라인에서 i번째 학기 노드의 가로 위치(%) */
const nodeX = (i: number) => ((i + 0.5) / SEMESTERS.length) * 100;

type Phase = "idle" | "extending";

interface Opened {
  origin: DOMRect;
}

interface RoadmapProps {
  student: Student;
  catalog: Catalog;
  onReset: () => void;
  onChangeTrack2: (ref: TrackRef | undefined) => void;
}

export function Roadmap({ student, catalog, onReset, onChangeTrack2 }: RoadmapProps) {
  const [plans, setPlans] = useState<SemesterPlan[]>(() => SEMESTERS.map(() => ({ courseIds: [], activityIds: [] })));
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [graduated, setGraduated] = useState(false);
  const [finished, setFinished] = useState<Opened | null>(null);
  const [peek, setPeek] = useState<number | null>(null);
  const [syllabus, setSyllabus] = useState<(Opened & { course: Course }) | null>(null);
  const [professor, setProfessor] = useState<(Opened & { id: string }) | null>(null);
  const [track2Picker, setTrack2Picker] = useState<Opened | null>(null);
  const [shake, setShake] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  const courseById = useMemo(() => new Map(catalog.courses.map((c) => [c.id, c])), [catalog]);
  const activityById = useMemo(() => new Map(catalog.activities.map((a) => [a.id, a])), [catalog]);

  // 제2트랙을 바꾸면 사라진 과목 id가 남을 수 있으므로 카탈로그에 있는 것만 센다.
  const coursesOf = useCallback(
    (p: SemesterPlan) => p.courseIds.map((id) => courseById.get(id)).filter((c): c is Course => !!c),
    [courseById],
  );
  const pointsOf = useCallback(
    (p: SemesterPlan) => p.activityIds.reduce((acc, id) => acc + (activityById.get(id)?.points ?? 0), 0),
    [activityById],
  );

  const plan = plans[current]!;
  const semCourses = coursesOf(plan);
  const semCredits = semCourses.reduce((acc, c) => acc + c.credits, 0);
  const semPoints = pointsOf(plan);

  const takenBefore = useMemo(
    () => new Set(plans.slice(0, current).flatMap((p) => p.courseIds)),
    [plans, current],
  );

  const status = useMemo(() => {
    const upToNow = plans.slice(0, current + 1);
    return evaluate(
      upToNow.flatMap(coursesOf),
      upToNow.reduce((acc, p) => acc + pointsOf(p), 0),
      !!student.track2,
    );
  }, [plans, current, coursesOf, pointsOf, student.track2]);

  const updatePlan = (fn: (p: SemesterPlan) => SemesterPlan) =>
    setPlans((prev) => prev.map((p, i) => (i === current ? fn(p) : p)));

  const flash = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const toggleCourse = (course: Course) => {
    if (plan.courseIds.includes(course.id)) {
      updatePlan((p) => ({ ...p, courseIds: p.courseIds.filter((id) => id !== course.id) }));
      return;
    }
    if (semCredits + course.credits > REQ.maxCreditsPerSemester) {
      setShake((n) => n + 1);
      flash(`한 학기는 최대 ${REQ.maxCreditsPerSemester}학점까지 담을 수 있어요.`);
      return;
    }
    updatePlan((p) => ({ ...p, courseIds: [...p.courseIds, course.id] }));
  };

  const toggleActivity = (id: string) =>
    updatePlan((p) => ({
      ...p,
      activityIds: p.activityIds.includes(id) ? p.activityIds.filter((a) => a !== id) : [...p.activityIds, id],
    }));

  const confirm = (origin: DOMRect) => {
    if (phase !== "idle") return;
    setPeek(null);
    if (current === SEMESTERS.length - 1) {
      setGraduated(true);
      setFinished({ origin });
      return;
    }
    setPhase("extending");
    setTimeout(() => {
      setCurrent((c) => c + 1);
      setPhase("idle");
    }, EXTEND_MS);
  };

  const boogiAt = phase === "extending" ? current + 1 : current;
  const panelLeft = `clamp(0px, calc(${nodeX(current)}% - 46px), calc(100% - min(660px, 100%)))`;
  const checklist = [
    { label: "필수교양(기초)", ok: isMet(status.liberalBasicTotal) },
    { label: "선택필수교양", ok: isMet(status.areaCount) && isMet(status.areaCredits) },
    { label: "제1트랙 39학점", ok: isMet(status.track1.total) },
    { label: "제2트랙 39학점", ok: !!status.track2 && isMet(status.track2.total) },
    { label: `졸업학점 ${REQ.totalCredits}`, ok: isMet(status.totalCredits) },
    { label: `비교과 ${REQ.extraPoints}pt`, ok: isMet(status.extraPoints) },
  ];
  const metCount = checklist.filter((c) => c.ok).length;
  const allMet = metCount === checklist.length;

  return (
    <div className="roadmap">
      <header className="topbar">
        <div className="topbar__brand">
          <b>NAKSAN.NAV</b>
          <span>Your 4 years, navigated.</span>
        </div>
        <div className="topbar__who">
          <span className="chip chip--blue">{student.studentId}</span>
          <span className="chip">{student.track1.track.name}</span>
          {student.track2 && <span className="chip">{student.track2.track.name}</span>}
          <span className="topbar__tags">{student.interests.map((t) => `#${t}`).join(" ")}</span>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onReset}>
          처음으로
        </button>
      </header>

      <div className="roadmap__body">
        <section className="journey" aria-label="학기별 로드맵">
          <div className="journey__lane">
            <div
              className={`journey__boogi ${phase === "extending" ? "is-running" : ""}`}
              style={{ left: `${nodeX(boogiAt)}%`, transitionDuration: `${EXTEND_MS}ms` }}
            >
              <Boogi running={phase === "extending"} scale={2} />
            </div>
          </div>

          <div className="timeline">
            {SEMESTERS.slice(0, current).map((_, i) => (
              <span
                key={`line-${i}`}
                className="timeline__line"
                style={{ left: `${nodeX(i)}%`, width: `${100 / SEMESTERS.length}%` }}
              />
            ))}
            {phase === "extending" && (
              <span
                className="timeline__line is-growing"
                style={{ left: `${nodeX(current)}%`, width: `${100 / SEMESTERS.length}%`, animationDuration: `${EXTEND_MS}ms` }}
              />
            )}
            {phase === "idle" && current < SEMESTERS.length - 1 && (
              <span className="timeline__dots" style={{ left: `${nodeX(current) + 100 / SEMESTERS.length / 2}%` }}>
                · · ·
              </span>
            )}

            {SEMESTERS.slice(0, current + 1).map((label, i) => {
              const done = i < current || (i === current && graduated);
              return (
                <div key={label} className="timeline__node-wrap" style={{ left: `${nodeX(i)}%` }}>
                  <span className="timeline__label">{label}</span>
                  <button
                    type="button"
                    className={`timeline__node ${done ? "is-done" : "is-current"}`}
                    aria-label={`${label} 학기${done ? " 요약 보기" : " (선택 중)"}`}
                    disabled={!done}
                    onClick={() => setPeek(peek === i ? null : i)}
                  >
                    {done ? "✓" : ""}
                  </button>
                  {peek === i && (
                    <div className={`peek peek--${i < 2 ? "start" : i > 5 ? "end" : "center"}`}>
                      <b>{label} 이수 계획</b>
                      <ul>
                        {coursesOf(plans[i]!).map((c) => (
                          <li key={c.id}>
                            {c.name} <span>{c.credits}</span>
                          </li>
                        ))}
                      </ul>
                      <p>
                        {coursesOf(plans[i]!).reduce((acc, c) => acc + c.credits, 0)}학점 · 비교과 {pointsOf(plans[i]!)}pt
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`panel-slot ${phase === "extending" ? "is-leaving" : ""}`}>
            <span className="panel-slot__caret" style={{ left: `calc(${nodeX(current)}% - 9px)` }} />
            <div className="panel-slot__inner" style={{ left: panelLeft }}>
              <CoursePanel
                key={`${current}-${student.track2?.track.id ?? ""}`}
                semesterLabel={SEMESTERS[current]!}
                grade={Math.floor(current / 2) + 1}
                isLast={current === SEMESTERS.length - 1}
                courses={catalog.courses.filter((c) => !takenBefore.has(c.id))}
                activities={catalog.activities}
                plan={plan}
                interests={student.interests}
                hasTrack2={!!student.track2}
                credits={semCredits}
                points={semPoints}
                shake={shake}
                toast={toast}
                busy={phase !== "idle"}
                onToggleCourse={toggleCourse}
                onToggleActivity={toggleActivity}
                onOpenSyllabus={(course, origin) => setSyllabus({ course, origin })}
                onConfirm={confirm}
              />
            </div>
          </div>
        </section>

        <div className="divider" aria-hidden />

        <RequirementsPanel
          status={status}
          version={requirementVersion(student.entryYear)}
          track1={student.track1.track.name}
          track2={student.track2?.track.name}
          onPickTrack2={(origin) => setTrack2Picker({ origin })}
        />
      </div>

      {syllabus && (
        <Genie
          origin={syllabus.origin}
          label={`${syllabus.course.name} 수업계획서`}
          className="genie-panel--syllabus"
          onClosed={() => setSyllabus(null)}
        >
          {() => (
            <SyllabusView
              course={syllabus.course}
              professor={catalog.professors[syllabus.course.professorId]}
              selected={plan.courseIds.includes(syllabus.course.id)}
              selectable={!takenBefore.has(syllabus.course.id)}
              onToggle={() => toggleCourse(syllabus.course)}
              onOpenProfessor={(id, origin) => setProfessor({ id, origin })}
            />
          )}
        </Genie>
      )}

      {professor && catalog.professors[professor.id] && (
        <Genie
          origin={professor.origin}
          label="교수 프로필"
          layer={1}
          className="genie-panel--professor"
          onClosed={() => setProfessor(null)}
        >
          {() => <ProfessorView professor={catalog.professors[professor.id]!} />}
        </Genie>
      )}

      {track2Picker && (
        <Genie
          origin={track2Picker.origin}
          label="제2트랙 선택"
          className="genie-panel--picker"
          onClosed={() => setTrack2Picker(null)}
        >
          {(close) => (
            <MajorPicker
              title="제2트랙 고르기"
              subtitle="졸업하려면 트랙 2개(각 39학점)를 이수해야 해요. 다른 학부 트랙도 고를 수 있어요."
              confirmLabel="제2트랙으로 추가"
              initial={student.track2 ?? null}
              excludeId={student.track1.track.id}
              onConfirm={(ref) => {
                onChangeTrack2(ref);
                close();
              }}
              onSkip={
                student.track2
                  ? () => {
                      onChangeTrack2(undefined);
                      close();
                    }
                  : close
              }
            />
          )}
        </Genie>
      )}

      {finished && (
        <Genie origin={finished.origin} label="4년 로드맵 완성" className="genie-panel--finish" onClosed={() => setFinished(null)}>
          {(close) => (
            <div className="finish">
              <div className="finish__boogi">
                <Boogi pose="front" mood={metCount >= 5 ? "happy" : metCount >= 3 ? "normal" : "sad"} scale={4} />
              </div>
              <h2>4년 로드맵을 다 그렸어요!</h2>
              <p className="finish__verdict">
                {allMet
                  ? "졸업요건을 모두 채웠어요. 부기도 신났어요!"
                  : `아직 ${checklist.length - metCount}개 요건이 남았어요. 지난 학기를 눌러 계획을 다시 살펴보세요.`}
              </p>
              <p>
                총 <b>{status.totalCredits.have}</b>/{REQ.totalCredits}학점 · 비교과 <b>{status.extraPoints.have}</b>/
                {REQ.extraPoints}pt
              </p>
              <ul className="finish__list">
                {checklist.map((c) => (
                  <li key={c.label} className={c.ok ? "ok" : ""}>
                    {c.label}
                  </li>
                ))}
              </ul>
              <div className="card__actions">
                <button type="button" className="btn btn--ghost" onClick={close}>
                  계속 수정하기
                </button>
                <button type="button" className="btn btn--primary" onClick={onReset}>
                  처음부터 다시
                </button>
              </div>
            </div>
          )}
        </Genie>
      )}
    </div>
  );
}
