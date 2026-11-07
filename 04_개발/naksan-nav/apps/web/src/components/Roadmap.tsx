import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { extraLedger, recognizedTotal } from "../lib/extracurricular";
import { evaluate, isMet, REQ, requirementVersion } from "../lib/requirements";
import {
  autoSectionIndex,
  clashesWith,
  overlaps,
  placeCourses,
  secLabel,
  sectionEntries,
  sectionsOf,
  type SectionLike,
  type TimetableEntry,
} from "../lib/timetable";
import { gpa, sampleTranscript, type Grade, type TranscriptRow } from "../lib/transcript";
import type { Activity, Catalog, Course, SemesterPlan, Student, TrackRef } from "../types";
import { Boogi } from "./Boogi";
import { CoursePanel } from "./CoursePanel";
import { Genie } from "./Genie";
import { MajorPicker } from "./MajorPicker";
import { MyPage } from "./MyPage";
import { ActivityGuide, type ExternalEntry } from "./ActivityGuide";
import { ActivityReviews } from "./ActivityReviews";
import { DecisionCheck } from "./DecisionCheck";
import { CREDIT, SEED_REVIEWS, type Review } from "../data/reviews";
import { ProfessorView } from "./ProfessorView";
import { RequirementsPanel } from "./RequirementsPanel";
import { SyllabusView } from "./SyllabusView";
import { TimetableView } from "./TimetableView";
import { TranscriptImport } from "./TranscriptImport";
import { DirectorySearch } from "./DirectorySearch";
import { AcademicAnalysis } from "./AcademicAnalysis";
import { GraduationPlan } from "./GraduationPlan";
import { CareerReport } from "./CareerReport";
import { creditLimit, type CreditLimit } from "../lib/creditLimit";
import { gpa as gpaOf } from "../lib/transcript";
import { RoadmapVersions, type SavedVersion, type VersionSummary } from "./RoadmapVersions";
import { COLLEGES } from "../data/majors";
import { buildCalendar, graduationOf, type Leave } from "../lib/leave";
import { normName } from "../data/hansung";

const SEMESTERS = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];
const EXTEND_MS = 700;

/** 타임라인에서 i번째 학기 노드의 가로 위치(%) */
const nodeX = (i: number) => ((i + 0.5) / SEMESTERS.length) * 100;
/** i번째 학기가 1학기인지 2학기인지 */
const termOf = (i: number) => ((i % 2) + 1) as 1 | 2;
/** 마지막 한글 글자에 받침이 있으면 앞 조사, 없으면 뒤 조사를 붙인다 (을/를, 은/는). */
const withJosa = (word: string, batchim: string, plain: string) => {
  const last = [...word].reverse().find((c) => c >= "가" && c <= "힣");
  return word + (last && (last.charCodeAt(0) - 0xac00) % 28 > 0 ? batchim : plain);
};

type Phase = "idle" | "extending" | "moving";

interface Opened {
  origin: DOMRect;
}

interface RoadmapProps {
  student: Student;
  catalog: Catalog;
  onReset: () => void;
  onChangeTrack2: (ref: TrackRef | undefined) => void;
}

interface Snapshot {
  plans: SemesterPlan[];
  reached: number;
  timetables: TimetableEntry[][];
  grades: Record<string, Grade>;
  externals: ExternalEntry[][];
  memos: string[];
  leaves: Leave[];
  extraCourses: Course[];
  gradChecks: Record<string, boolean[]>;
  track2?: string;
}

/** 편입생은 편입 학년부터 시작하고, 편입 전 학점은 '인정학점' 한 덩어리로 넣는다. */
function transferStart(student: Student): { start: number; recognized: Course | null } {
  const a = student.admission;
  if (!a || (a.kind !== "일반편입" && a.kind !== "학사편입")) return { start: 0, recognized: null };
  const grade = a.kind === "학사편입" ? 3 : (a.transferGrade ?? 3);
  const credits = grade === 2 ? 33 : 65;
  return {
    start: (grade - 1) * 2,
    recognized: {
      id: "transfer-recognized",
      name: `편입 전 인정학점 (${a.kind === "학사편입" ? "학사편입" : `${grade}학년 편입`})`,
      category: "일반선택",
      credits,
      grade: 0,
      tags: [],
      professorId: "",
      source: "transcript",
    },
  };
}

export function Roadmap({ student, catalog, onReset, onChangeTrack2 }: RoadmapProps) {
  const transfer = useMemo(() => transferStart(student), []); // eslint-disable-line react-hooks/exhaustive-deps
  // 필수교양과 전공필수는 해당 학년·학기에 기본으로 담아 둔다. 빼고 싶으면 체크를 풀면 된다.
  const [plans, setPlans] = useState<SemesterPlan[]>(() =>
    SEMESTERS.map((_, i) => {
      if (i < transfer.start) return { courseIds: i === transfer.start - 1 && transfer.recognized ? [transfer.recognized.id] : [], activityIds: [] };
      const grade = Math.floor(i / 2) + 1;
      const term = termOf(i);
      const ids: string[] = [];
      let credits = 0;
      for (const c of catalog.courses) {
        const required = c.category === "필수교양" || (c.trackSlot && c.category === "전공필수");
        if (!required || c.grade !== grade || (c.term ?? 1) !== term) continue;
        if (credits + c.credits > REQ.baseCreditsPerSemester) continue;
        ids.push(c.id);
        credits += c.credits;
      }
      return { courseIds: ids, activityIds: [] };
    }),
  );
  const [current, setCurrent] = useState(transfer.start);
  /** 지금까지 열어 본 가장 먼 학기 */
  const [reached, setReached] = useState(transfer.start);
  // 기본으로 담아 둔 과목도 처음부터 시간이 안 겹치는 분반으로 시간표에 들어가 있다.
  const [timetables, setTimetables] = useState<TimetableEntry[][]>(() => {
    const byId = new Map(catalog.courses.map((c) => [c.id, c]));
    return plans.map((p, i) => placeCourses(p.courseIds.flatMap((id) => byId.get(id) ?? []), termOf(i)));
  });
  const [grades, setGrades] = useState<Record<string, Grade>>({});
  const [myPage, setMyPage] = useState<Opened | null>(null);
  const [timetableOpen, setTimetableOpen] = useState<Opened | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState<(Opened & { mode?: "grades" | "extra" }) | null>(null);
  const [reportOpen, setReportOpen] = useState<Opened | null>(null);
  const [guideOpen, setGuideOpen] = useState<Opened | null>(null);
  const [dirOpen, setDirOpen] = useState<Opened | null>(null);
  const [anaOpen, setAnaOpen] = useState<Opened | null>(null);
  const [gradOpen, setGradOpen] = useState<Opened | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [gradChecks, setGradChecks] = useState<Record<string, boolean[]>>({});
  const [verOpen, setVerOpen] = useState<Opened | null>(null);
  const verKey = `naksan-nav:versions:${student.studentId}`;
  const [versions, setVersions] = useState<SavedVersion<Snapshot>[]>(() => {
    try {
      const raw = window.localStorage.getItem(verKey);
      return raw ? (JSON.parse(raw) as SavedVersion<Snapshot>[]) : [];
    } catch {
      return [];
    }
  });
  const [activeVer, setActiveVer] = useState<string | null>(null);
  const persistVersions = (next: SavedVersion<Snapshot>[]) => {
    setVersions(next);
    try {
      window.localStorage.setItem(verKey, JSON.stringify(next));
    } catch {
      /* 저장 공간을 못 쓰면 이번 세션에서만 유지 */
    }
  };
  /** 성적표 캡처에서 읽었지만 교육과정에 없는 과목 */
  const [extraCourses, setExtraCourses] = useState<Course[]>(() => (transfer.recognized ? [transfer.recognized] : []));
  const [externals, setExternals] = useState<ExternalEntry[][]>(() => SEMESTERS.map(() => []));
  const [reviews, setReviews] = useState<Record<string, Review[]>>(SEED_REVIEWS);
  const [credits, setCredits] = useState(0);
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set());
  const [memos, setMemos] = useState<string[]>(() => SEMESTERS.map(() => ""));
  const [decide, setDecide] = useState<Opened | null>(null);
  const [reviewOpen, setReviewOpen] = useState<(Opened & { activity: Activity }) | null>(null);
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

  const courseById = useMemo(
    () => new Map([...catalog.courses, ...extraCourses].map((c) => [c.id, c])),
    [catalog, extraCourses],
  );
  const matchCourse = (name: string) => {
    const key = normName(name);
    const c = catalog.courses.find((x) => normName(x.name) === key);
    return c ? { courseId: c.id, category: c.category } : null;
  };
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
  const term = termOf(current);
  const semCourses = coursesOf(plan);
  const semCredits = semCourses.reduce((acc, c) => acc + c.credits, 0);
  const extSum = (i: number) => externals[i]!.reduce((acc, e) => acc + e.points, 0);
  const semPoints = pointsOf(plan) + extSum(current);

  // 다른 학기에 이미 담은 과목은 이번 학기 목록에서 뺀다.
  const takenBefore = useMemo(
    () => new Set(plans.flatMap((p, i) => (i === current ? [] : p.courseIds))),
    [plans, current],
  );

  // 비교과는 학기별 인정 한도(200pt)·이월·소멸을 반영한 인정 포인트로 센다.
  const ledger = useMemo(
    () => extraLedger(plans.map((p, i) => pointsOf(p) + externals[i]!.reduce((acc, e) => acc + e.points, 0))),
    [plans, pointsOf, externals],
  );

  const status = useMemo(() => {
    const upToNow = plans.slice(0, reached + 1);
    return evaluate(upToNow.flatMap(coursesOf), recognizedTotal(ledger.slice(0, reached + 1)), !!student.track2);
  }, [plans, reached, coursesOf, ledger, student.track2]);

  // 휴학을 반영한 실제 학기 달력·졸업 시기 (대시보드 타임라인에 표시)
  const calendar = useMemo(() => buildCalendar(student.entryYear, leaves), [student.entryYear, leaves]);
  const gradDate = useMemo(() => graduationOf(calendar), [calendar]);
  const calOf = (i: number) => calendar.find((c) => c.study === i)!;
  const leaveSemesters = leaves.reduce((a, l) => a + l.semesters, 0);

  /** 학기별 수강신청 가능 학점 (직전 학기 학점·성적으로 이월/성적우수 반영) */
  const limits = useMemo<CreditLimit[]>(
    () =>
      plans.map((_, i) => {
        if (i === 0) return creditLimit({ base: REQ.baseCreditsPerSemester, prevCredits: null, prevGpa: null, prevHasF: false });
        const prev = coursesOf(plans[i - 1]!).filter((c) => c.id !== "transfer-recognized");
        if (!prev.length) return creditLimit({ base: REQ.baseCreditsPerSemester, prevCredits: null, prevGpa: null, prevHasF: false });
        const graded = prev.filter((c) => grades[c.id]);
        return creditLimit({
          base: REQ.baseCreditsPerSemester,
          prevCredits: prev.reduce((a, c) => a + c.credits, 0),
          prevGpa: graded.length ? gpaOf(graded.map((c) => ({ credits: c.credits, grade: grades[c.id]! }))) : null,
          prevHasF: graded.some((c) => grades[c.id] === "F"),
        });
      }),
    [plans, coursesOf, grades],
  );

  /** 8학기 계획 전체로 본 졸업요건 (휴학·졸업 화면의 졸업/수료 예상) */
  const plannedStatus = useMemo(
    () => evaluate(plans.flatMap(coursesOf), recognizedTotal(ledger), !!student.track2),
    [plans, coursesOf, ledger, student.track2],
  );

  const versionSummary = (snap: Snapshot): VersionSummary => {
    const cs = snap.plans.flatMap((p) => p.courseIds.map((id) => courseById.get(id) ?? snap.extraCourses.find((c) => c.id === id)).filter((c): c is Course => !!c));
    return {
      credits: cs.reduce((a, c) => a + c.credits, 0),
      majorCredits: cs.filter((c) => c.trackSlot).reduce((a, c) => a + c.credits, 0),
      points: recognizedTotal(extraLedger(snap.plans.map((p, i) => pointsOf(p) + (snap.externals[i] ?? []).reduce((a, e) => a + e.points, 0)))),
      track2: snap.track2,
      reached: snap.reached,
    };
  };
  const snapshot = (): Snapshot => ({ plans, reached, timetables, grades, externals, memos, leaves, extraCourses, gradChecks, track2: student.track2?.track.name });
  const restore = (snap: Snapshot) => {
    if ((snap.track2 ?? "") !== (student.track2?.track.name ?? "")) {
      const ref = COLLEGES.flatMap((c) => c.units.flatMap((u) => u.tracks.map((t) => ({ college: c.name, unit: u.name, track: t })))).find(
        (r) => r.track.name === snap.track2,
      );
      onChangeTrack2(ref);
    }
    setPlans(snap.plans);
    setReached(snap.reached);
    setCurrent(Math.min(current, snap.reached));
    setTimetables(snap.timetables);
    setGrades(snap.grades);
    setExternals(snap.externals);
    setMemos(snap.memos);
    setLeaves(snap.leaves);
    setExtraCourses(snap.extraCourses);
    setGradChecks(snap.gradChecks);
  };
  const stamp = () => new Date().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const updatePlan = (fn: (p: SemesterPlan) => SemesterPlan) =>
    setPlans((prev) => prev.map((p, i) => (i === current ? fn(p) : p)));

  const flash = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const setSemesterTimetable = (fn: (entries: TimetableEntry[]) => TimetableEntry[]) =>
    setTimetables((prev) => prev.map((t, i) => (i === current ? fn(t) : t)));

  /** 학점 한도 안이면 과목을 담고 true */
  const addCourse = (course: Course) => {
    const lim = limits[current]!;
    if (semCredits + course.credits > lim.limit) {
      setShake((n) => n + 1);
      flash(`이번 학기는 최대 ${lim.limit}학점이에요 (${lim.reason}).`);
      return false;
    }
    updatePlan((p) => ({ ...p, courseIds: [...p.courseIds, course.id] }));
    return true;
  };

  /**
   * 분반 시간을 이번 학기 시간표에 넣는다. 직접 고른 분반은 늘 알려 주고,
   * 담을 때 저절로 넣은 분반은 온라인이거나 어느 분반이든 겹칠 때만 알려 준다.
   */
  const placeSection = (course: Course, section: SectionLike, chosen: boolean) => {
    const added = sectionEntries(course.name, section);
    const clash = clashesWith(added, timetables[current]!.filter((e) => e.name !== course.name));
    setSemesterTimetable((t) => [...t.filter((e) => e.name !== course.name), ...added]);
    const who = `${course.name} ${secLabel(section)}반(${section.prof || "미정"})`;
    if (!added.length)
      flash(`${withJosa(who, "은", "는")} ${chosen ? "시간이 정해지지 않은 온라인 강좌예요." : "온라인 강좌라 시간표 칸 없이 담았어요."}`);
    else if (clash.length)
      flash(
        chosen
          ? `${withJosa(who, "을", "를")} 넣었어요. ${clash.join(", ")} 과목과 시간이 겹쳐요.`
          : `${withJosa(course.name, "은", "는")} 모든 분반이 다른 과목과 시간이 겹쳐요.`,
      );
    else if (chosen) flash(`${withJosa(who, "을", "를")} 이번 학기 시간표에 넣었어요.`);
  };

  const toggleCourse = (course: Course) => {
    if (plan.courseIds.includes(course.id)) {
      updatePlan((p) => ({ ...p, courseIds: p.courseIds.filter((id) => id !== course.id) }));
      // 뺀 과목은 이번 학기 시간표에서도 뺀다.
      setSemesterTimetable((t) => t.filter((e) => e.name !== course.name));
      return;
    }
    if (!addCourse(course)) return;
    // 담으면 이번 학기 분반 중 다른 과목과 안 겹치는 분반을 골라 바로 시간표에 넣는다.
    // 시간표에 직접 적어 둔 과목이면 그대로 둔다.
    const entries = timetables[current]!;
    if (entries.some((e) => e.name === course.name)) return;
    const sections = sectionsOf(course);
    const index = autoSectionIndex(course.name, sections, term, entries);
    if (index >= 0) placeSection(course, sections[index]!, false);
  };

  /** 수업 리스트에서 분반을 고르면 과목을 담고 이번 학기 시간표에 그 분반 시간을 넣는다. */
  const pickSection = (course: Course, index: number) => {
    const section = sectionsOf(course)[index];
    if (!section) return;
    if (!plan.courseIds.includes(course.id) && !addCourse(course)) return;
    placeSection(course, section, true);
  };

  const toggleActivity = (id: string) => {
    const adding = !plan.activityIds.includes(id);
    updatePlan((p) => ({
      ...p,
      activityIds: adding ? [...p.activityIds, id] : p.activityIds.filter((a) => a !== id),
    }));
    if (!adding) return;
    const pool = semPoints + (activityById.get(id)?.points ?? 0) + (ledger[current]?.carryIn ?? 0);
    if (pool > 400) flash(`이번 학기 ${pool}pt · 400pt를 넘는 ${pool - 400}pt는 소멸돼요.`);
    else if (pool > 200) flash(`이번 학기 인정은 200pt까지예요. ${pool - 200}pt는 다음 학기로 이월돼요.`);
  };

  const goTo = (i: number) => {
    if (i === current || i > reached || phase !== "idle") return;
    setPeek(null);
    setPhase("moving");
    setCurrent(i);
    setTimeout(() => setPhase("idle"), EXTEND_MS);
  };

  const applyTranscript = (rows: TranscriptRow[]) => {
    const unknown = rows.filter((r) => !catalog.courses.some((c) => c.id === r.courseId));
    if (unknown.length)
      setExtraCourses((prev) => [
        ...prev.filter((c) => !unknown.some((u) => u.courseId === c.id)),
        ...unknown.map(
          (r): Course => ({
            id: r.courseId,
            name: r.name,
            category: r.category,
            credits: r.credits,
            grade: 0,
            tags: [],
            professorId: "",
            trackSlot: r.category.startsWith("전공") ? 1 : undefined,
            source: "transcript",
          }),
        ),
      ]);
    const ids = new Set(rows.map((r) => r.courseId));
    setPlans((prev) =>
      prev.map((p, i) => {
        const mine = rows.filter((r) => r.semester === i).map((r) => r.courseId);
        const rest = p.courseIds.filter((id) => !ids.has(id));
        return { ...p, courseIds: mine.length ? [...mine, ...rest.filter((id) => !mine.includes(id))] : rest };
      }),
    );
    setGrades((prev) => ({ ...prev, ...Object.fromEntries(rows.map((r) => [r.courseId, r.grade])) }));
    const last = Math.max(...rows.map((r) => r.semester));
    const next = Math.min(last + 1, SEMESTERS.length - 1);
    setReached((r) => Math.max(r, next));
    setCurrent(next);
    flash(`${SEMESTERS.slice(0, last + 1).join(", ")} 성적을 반영했어요.`);
  };

  // 결정 버튼은 바로 넘어가지 않고, 점검 화면에서 한 번 더 생각하게 한다.
  const confirm = (origin: DOMRect) => {
    if (phase !== "idle") return;
    setPeek(null);
    setDecide({ origin });
  };

  const commit = (origin: DOMRect) => {
    if (current < reached) {
      goTo(current + 1);
      return;
    }
    if (current === SEMESTERS.length - 1) {
      setGraduated(true);
      setFinished({ origin });
      return;
    }
    setPhase("extending");
    setTimeout(() => {
      setCurrent((c) => c + 1);
      setReached((r) => Math.max(r, current + 1));
      setPhase("idle");
    }, EXTEND_MS);
  };

  const boogiAt = phase === "extending" ? current + 1 : current;
  // 패널 너비(--panel-w)는 styles.css 의 .panel-slot 에서 정한다.
  const panelLeft = `clamp(0px, calc(${nodeX(current)}% - 46px), calc(100% - var(--panel-w)))`;
  const checklist = [
    { label: "필수교양(기초)", ok: isMet(status.liberalBasicTotal), fix: "교양 탭에서 필수교양을 담아요" },
    { label: "선택필수교양", ok: isMet(status.areaCount) && isMet(status.areaCredits), fix: "3개 분야 이상 7~9학점을 채워요" },
    { label: "제1트랙 39학점", ok: isMet(status.track1.total), fix: `${status.track1.total.need - status.track1.total.have}학점 더 필요해요` },
    {
      label: "제2트랙 39학점",
      ok: !!status.track2 && isMet(status.track2.total),
      fix: status.track2 ? `${status.track2.total.need - status.track2.total.have}학점 더 필요해요` : "제2트랙을 아직 고르지 않았어요",
      track2: !status.track2,
    },
    { label: `졸업학점 ${REQ.totalCredits}`, ok: isMet(status.totalCredits), fix: `${REQ.totalCredits - status.totalCredits.have}학점 더 필요해요` },
    { label: `비교과 ${REQ.extraPoints}pt`, ok: isMet(status.extraPoints), fix: `인정 기준 ${REQ.extraPoints - status.extraPoints.have}pt 더 필요해요`, extra: true },
  ];
  const metCount = checklist.filter((c) => c.ok).length;
  const creditsAt = (i: number) => coursesOf(plans[i]!).reduce((acc, c) => acc + c.credits, 0);
  const lightest = (by: (i: number) => number) =>
    SEMESTERS.slice(0, reached + 1).reduce((best, _, i) => (by(i) < by(best) ? i : best), 0);
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
          <span className="chip chip--credit" title="후기를 쓰면 쌓이는 앱 안의 포인트 (현금 가치 없음)">
            후기 크레딧 {credits}
          </span>
          <span className="topbar__tags">{student.interests.map((t) => `#${t}`).join(" ")}</span>
        </div>
        <nav className="topbar__actions">
          <button type="button" className="chip chip--ver" onClick={(e) => setVerOpen({ origin: e.currentTarget.getBoundingClientRect() })}>
            {versions.find((v) => v.id === activeVer)?.name ?? "로드맵 버전"} ▾
          </button>
          <button type="button" className="btn btn--primary btn--sm btn--shine" onClick={(e) => setAnaOpen({ origin: e.currentTarget.getBoundingClientRect() })}>
            <span aria-hidden="true" className="btn__spark">✦</span> 학업 분석
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={(e) => setGradOpen({ origin: e.currentTarget.getBoundingClientRect() })}>
            휴학·졸업
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={(e) => setTimetableOpen({ origin: e.currentTarget.getBoundingClientRect() })}>
            시간표
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={(e) => setDirOpen({ origin: e.currentTarget.getBoundingClientRect() })}>
            전화번호
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={(e) => setGuideOpen({ origin: e.currentTarget.getBoundingClientRect() })}>
            비교과·자격증
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={(e) => setMyPage({ origin: e.currentTarget.getBoundingClientRect() })}>
            내 페이지
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onReset}>
            처음으로
          </button>
        </nav>
      </header>

      <div className="roadmap__body">
        <section className="journey" aria-label="학기별 로드맵">
          <div className="journey__lane">
            <div
              className={`journey__boogi ${phase !== "idle" ? "is-running" : ""}`}
              style={{ left: `${nodeX(boogiAt)}%`, transitionDuration: `${EXTEND_MS}ms` }}
            >
              <Boogi running={phase !== "idle"} scale={2} />
            </div>
          </div>

          <div className="timeline">
            {SEMESTERS.slice(0, reached).map((_, i) => (
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
            {phase !== "extending" && reached < SEMESTERS.length - 1 && (
              <span className="timeline__dots" style={{ left: `${nodeX(reached) + 100 / SEMESTERS.length / 2}%` }}>
                · · ·
              </span>
            )}

            {leaves.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`timeline__leave ${l.before > reached ? "is-future" : ""}`}
                style={{ left: `${nodeX(l.before) - 100 / SEMESTERS.length / 2}%` }}
                onClick={(e) => setGradOpen({ origin: e.currentTarget.getBoundingClientRect() })}
                title="휴학 계획 보기"
              >
                {l.kind}휴학 {l.semesters}학기
              </button>
            ))}
            {SEMESTERS.slice(0, reached + 1).map((label, i) => {
              const done = i < reached || graduated;
              const here = i === current;
              return (
                <div key={label} className="timeline__node-wrap" style={{ left: `${nodeX(i)}%` }}>
                  <span className={`timeline__label ${here ? "is-here" : ""}`}>{label}</span>
                  <span className="timeline__year">
                    {calOf(i).year}-{calOf(i).term}
                  </span>
                  <button
                    type="button"
                    className={`timeline__node ${done ? "is-done" : ""} ${here ? "is-current" : ""}`}
                    aria-label={here ? `${label} 학기 (지금 보는 학기)` : `${label} 학기로 이동`}
                    aria-current={here ? "step" : undefined}
                    onClick={() => goTo(i)}
                    onMouseEnter={() => !here && setPeek(i)}
                    onMouseLeave={() => setPeek(null)}
                    onFocus={() => !here && setPeek(i)}
                    onBlur={() => setPeek(null)}
                  >
                    {done ? "✓" : ""}
                  </button>
                  {peek === i && (
                    <div className={`peek peek--${i < 2 ? "start" : i > 5 ? "end" : "center"}`}>
                      <b>{label} 이수 계획</b>
                      <ul>
                        {coursesOf(plans[i]!).map((c) => (
                          <li key={c.id}>
                            {c.name} <span>{grades[c.id] ? `${grades[c.id]} · ` : ""}{c.credits}</span>
                          </li>
                        ))}
                      </ul>
                      <p>
                        {coursesOf(plans[i]!).reduce((acc, c) => acc + c.credits, 0)}학점 · 비교과 인정 {ledger[i]!.recognized}pt
                      </p>
                      <p className="peek__go">눌러서 이 학기로 이동</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="journey__meta">
            <p className="timeline__hint">학기 아이콘을 누르면 그 학기로 앞뒤 이동해서 다시 고칠 수 있어요.</p>
            <button type="button" className="grad-chip" onClick={(e) => setGradOpen({ origin: e.currentTarget.getBoundingClientRect() })}>
              🎓 {gradDate.label} 예정{leaveSemesters ? ` · 휴학 ${leaveSemesters}학기 포함` : ""}
            </button>
          </div>

          <div className={`panel-slot ${phase === "extending" ? "is-leaving" : ""}`}>
            <span className="panel-slot__caret" style={{ left: `calc(${nodeX(current)}% - 9px)` }} />
            <div className="panel-slot__inner" style={{ left: panelLeft }}>
              <CoursePanel
                key={`${current}-${student.track2?.track.id ?? ""}`}
                semesterLabel={SEMESTERS[current]!}
                grade={Math.floor(current / 2) + 1}
                term={term}
                isLast={current === SEMESTERS.length - 1}
                revisiting={current < reached}
                extra={ledger[current]!}
                courses={catalog.courses.filter((c) => !takenBefore.has(c.id))}
                activities={catalog.activities}
                plan={plan}
                interests={student.interests}
                hasTrack2={!!student.track2}
                credits={semCredits}
                limit={limits[current]!}
                points={semPoints}
                shake={shake}
                toast={toast}
                busy={phase !== "idle"}
                onToggleCourse={toggleCourse}
                timetable={timetables[current]!}
                onPickSection={pickSection}
                onOpenTimetable={(origin) => setTimetableOpen({ origin })}
                onToggleActivity={toggleActivity}
                onOpenSyllabus={(course, origin) => setSyllabus({ course, origin })}
                onOpenReviews={(activity, origin) => setReviewOpen({ activity, origin })}
                reviewCounts={Object.fromEntries(Object.entries(reviews).map(([k, v]) => [k, v.length]))}
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
          semesterLabel={SEMESTERS[current]!}
          extra={ledger[current]!}
          onPickTrack2={(origin) => setTrack2Picker({ origin })}
          gradChecks={gradChecks}
          onToggleGrad={(t, i) =>
            setGradChecks((prev) => {
              const arr = [...(prev[t] ?? [])];
              arr[i] = !arr[i];
              return { ...prev, [t]: arr };
            })
          }
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
              hasProfessor={(id) => !!catalog.professors[id]}
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

      {myPage && (
        <Genie origin={myPage.origin} label="내 페이지" className="genie-panel--report" onClosed={() => setMyPage(null)}>
          {(close) => (
            <MyPage
              student={student}
              version={requirementVersion(student.entryYear)}
              status={status}
              current={current}
              grades={grades}
              semesters={SEMESTERS.slice(0, reached + 1).map((label, i) => ({
                label,
                courses: coursesOf(plans[i]!),
                extra: ledger[i]!,
                hasTimetable: timetables[i]!.length > 0,
                memo: memos[i]!,
              }))}
              onGoSemester={(i) => {
                close();
                goTo(i);
              }}
              onOpenTimetable={(origin) => setTimetableOpen({ origin })}
              onOpenTranscript={(origin) => setTranscriptOpen({ origin })}
              calendar={calendar}
              graduation={gradDate}
              onOpenGraduation={(origin) => setGradOpen({ origin })}
            />
          )}
        </Genie>
      )}

      {timetableOpen && (
        <Genie origin={timetableOpen.origin} label="시간표" layer={1} className="genie-panel--wide" onClosed={() => setTimetableOpen(null)}>
          {() => (
            <TimetableView
              semesterLabel={SEMESTERS[current]!}
              term={term}
              courseNames={semCourses.map((c) => c.name)}
              courses={semCourses}
              entries={timetables[current]!}
              onOpenCapture={(origin) => setTranscriptOpen({ origin, mode: "grades" })}
              onChange={(entries) => setTimetables((prev) => prev.map((t, i) => (i === current ? entries : t)))}
            />
          )}
        </Genie>
      )}

      {transcriptOpen && (
        <Genie origin={transcriptOpen.origin} label="성적표 입력" layer={1} className="genie-panel--wide" onClosed={() => setTranscriptOpen(null)}>
          {(close) => (
            <TranscriptImport
              entryYear={student.entryYear}
              initialMode={transcriptOpen.mode ?? "grades"}
              matchCourse={matchCourse}
              makeSample={() => sampleTranscript(catalog)}
              onApplyGrades={(rows) => {
                applyTranscript(rows);
                close();
              }}
              onApplyExtra={(rows) => {
                setExternals((prev) =>
                  prev.map((x, i) => [
                    ...x,
                    ...rows
                      .filter((r) => r.semester === i)
                      .map((r, k) => ({ id: `cap-${i}-${k}-${Date.now()}`, kind: "captured", name: r.name, points: r.points })),
                  ]),
                );
                const last = Math.max(...rows.map((r) => r.semester));
                setReached((r) => Math.max(r, Math.min(last + 1, SEMESTERS.length - 1)));
                flash(`비교과 ${rows.length}건을 학기별로 반영했어요.`);
                close();
              }}
            />
          )}
        </Genie>
      )}

      {anaOpen && (
        <Genie origin={anaOpen.origin} label="학업 분석" className="genie-panel--wide" onClosed={() => setAnaOpen(null)}>
          {(close) => (
            <AcademicAnalysis
              student={student}
              reached={reached}
              status={status}
              taken={plans
                .slice(0, reached + 1)
                .flatMap((p, semester) => coursesOf(p).map((course) => ({ course, semester, grade: grades[course.id] })))}
              onPickTrack2={(ref) => {
                onChangeTrack2(ref);
                close();
                flash(`제2트랙을 ${ref.track.name}(으)로 정했어요.`);
              }}
              onOpenCapture={() => setTranscriptOpen({ origin: anaOpen.origin })}
            />
          )}
        </Genie>
      )}

      {verOpen && (
        <Genie origin={verOpen.origin} label="로드맵 버전" className="genie-panel--wide" onClosed={() => setVerOpen(null)}>
          {(close) => (
            <RoadmapVersions
              versions={versions}
              activeId={activeVer}
              current={versionSummary(snapshot())}
              onSaveNew={(name) => {
                const snap = snapshot();
                const v = { id: `v${Date.now()}`, name, savedAt: stamp(), summary: versionSummary(snap), data: snap };
                persistVersions([...versions, v]);
                setActiveVer(v.id);
                flash(`「${name}」으로 저장했어요.`);
              }}
              onOverwrite={(id) => {
                const snap = snapshot();
                persistVersions(versions.map((v) => (v.id === id ? { ...v, savedAt: stamp(), summary: versionSummary(snap), data: snap } : v)));
                setActiveVer(id);
                flash("지금 설계로 덮어썼어요.");
              }}
              onLoad={(id) => {
                const v = versions.find((x) => x.id === id);
                if (!v) return;
                restore(v.data);
                setActiveVer(id);
                close();
                flash(`「${v.name}」을 불러왔어요.`);
              }}
              onDelete={(id) => {
                persistVersions(versions.filter((v) => v.id !== id));
                if (activeVer === id) setActiveVer(null);
              }}
              onRename={(id, name) => persistVersions(versions.map((v) => (v.id === id ? { ...v, name } : v)))}
            />
          )}
        </Genie>
      )}

      {reportOpen && (
        <Genie origin={reportOpen.origin} label="AI 취업 준비 분석" layer={1} className="genie-panel--report" onClosed={() => setReportOpen(null)}>
          {(close) => (
            <CareerReport
              student={student}
              semesters={plans.map((p, i) => ({
                courses: coursesOf(p),
                activities: p.activityIds.map((id) => activityById.get(id)).filter((a): a is NonNullable<typeof a> => !!a),
                extra: ledger[i]!,
              }))}
              catalogCourses={catalog.courses}
              catalogActivities={catalog.activities}
              status={plannedStatus}
              gpa={gpa(plans.flatMap(coursesOf).filter((c) => grades[c.id]).map((c) => ({ credits: c.credits, grade: grades[c.id]! })))}
              onGoSemester={(i) => {
                close();
                setFinished(null);
                window.setTimeout(() => goTo(i), 450);
              }}
            />
          )}
        </Genie>
      )}

      {gradOpen && (
        <Genie origin={gradOpen.origin} label="휴학 · 졸업 시기" className="genie-panel--wide" onClosed={() => setGradOpen(null)}>
          {() => (
            <GraduationPlan
              student={student}
              leaves={leaves}
              onChangeLeaves={setLeaves}
              reached={reached}
              planned={plannedStatus}
              gpa={gpa(plans.flatMap(coursesOf).filter((c) => grades[c.id]).map((c) => ({ credits: c.credits, grade: grades[c.id]! })))}
            />
          )}
        </Genie>
      )}

      {dirOpen && (
        <Genie origin={dirOpen.origin} label="전화번호 찾기" className="genie-panel--review" onClosed={() => setDirOpen(null)}>
          {() => <DirectorySearch />}
        </Genie>
      )}

      {guideOpen && (
        <Genie origin={guideOpen.origin} label="비교과·자격증 가이드" className="genie-panel--wide" onClosed={() => setGuideOpen(null)}>
          {() => (
            <ActivityGuide
              semesterLabel={SEMESTERS[current]!}
              interests={student.interests}
              entries={externals[current]!}
              onOpenCapture={(origin) => setTranscriptOpen({ origin, mode: "extra" })}
              onAdd={(entry) => {
                const pool = semPoints + entry.points + (ledger[current]?.carryIn ?? 0);
                setExternals((prev) => prev.map((x, i) => (i === current ? [...x, entry] : x)));
                if (pool > 400) flash(`이번 학기 ${pool}pt · 400pt를 넘는 ${pool - 400}pt는 소멸돼요.`);
                else if (pool > 200) flash(`이번 학기 인정은 200pt까지예요. ${pool - 200}pt는 다음 학기로 이월돼요.`);
                else flash(`${SEMESTERS[current]} 학기에 ${entry.points}pt를 더했어요.`);
              }}
              onRemove={(id) => setExternals((prev) => prev.map((x, i) => (i === current ? x.filter((e) => e.id !== id) : x)))}
            />
          )}
        </Genie>
      )}

      {reviewOpen && (
        <Genie origin={reviewOpen.origin} label={`${reviewOpen.activity.name} 후기`} className="genie-panel--review" onClosed={() => setReviewOpen(null)}>
          {() => (
            <ActivityReviews
              activity={reviewOpen.activity}
              reviews={reviews[reviewOpen.activity.id] ?? []}
              credits={credits}
              unlocked={unlocked.has(reviewOpen.activity.id)}
              semesterLabel={SEMESTERS[current]!}
              onUnlock={() => {
                if (credits < CREDIT.unlockCost) return;
                setCredits((c) => c - CREDIT.unlockCost);
                setUnlocked((prev) => new Set(prev).add(reviewOpen.activity.id));
              }}
              onWrite={(rv) => {
                const id = reviewOpen.activity.id;
                setReviews((prev) => ({ ...prev, [id]: [{ ...rv, id: `rv-${Date.now()}` }, ...(prev[id] ?? [])] }));
                setCredits((c) => c + CREDIT.perReview);
                flash(`후기 고마워요! ${CREDIT.perReview}크레딧을 받았어요.`);
              }}
            />
          )}
        </Genie>
      )}

      {decide && (
        <Genie origin={decide.origin} label={`${SEMESTERS[current]} 학기 점검`} className="genie-panel--review" onClosed={() => setDecide(null)}>
          {(close) => (
            <DecisionCheck
              semesterLabel={SEMESTERS[current]!}
              grade={Math.floor(current / 2) + 1}
              semestersLeft={SEMESTERS.length - 1 - current}
              courses={semCourses}
              extra={ledger[current]!}
              status={status}
              hasTrack2={!!student.track2}
              clashCount={overlaps(timetables[current]!).size}
              memo={memos[current]!}
              revisiting={current < reached}
              onMemo={(text) => setMemos((prev) => prev.map((m, i) => (i === current ? text : m)))}
              onBack={close}
              onDecide={() => {
                const origin = decide.origin;
                close();
                window.setTimeout(() => commit(origin), 120);
              }}
            />
          )}
        </Genie>
      )}

      {finished && (
        <Genie origin={finished.origin} label="4년 설계 점검" className="genie-panel--finish" onClosed={() => setFinished(null)}>
          {(close) => (
            <div className="finish">
              {allMet && (
                <div className="confetti" aria-hidden="true">
                  {Array.from({ length: 28 }, (_, i) => (
                    <i
                      key={i}
                      style={
                        {
                          left: `${(i * 37) % 100}%`,
                          background: ["#4178c0", "#e0b03c", "#8b5cf6", "#34c38f", "#ff7aa2"][i % 5],
                          animationDelay: `${(i % 7) * 60}ms`,
                          "--dx": `${((i * 53) % 120) - 60}px`,
                          "--rot": `${(i * 97) % 540}deg`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )}
              <div className="finish__boogi">
                <Boogi pose="front" mood={metCount >= 5 ? "happy" : metCount >= 3 ? "normal" : "sad"} scale={4} />
              </div>
              <h2>{allMet ? "졸업요건을 모두 채운 설계예요" : "4년 설계 1차안이 나왔어요"}</h2>
              <p className="finish__verdict">
                {allMet
                  ? "매 학기 성적이 나오면 성적표를 반영하고, 계획과 달라진 점을 다시 점검해요."
                  : `아직 ${checklist.length - metCount}개 요건이 남았어요. 항목을 눌러 해당 학기로 가서 다시 고민해 보세요.`}
              </p>
              <p>
                총 <b>{status.totalCredits.have}</b>/{REQ.totalCredits}학점 · 비교과 인정 <b>{status.extraPoints.have}</b>/
                {REQ.extraPoints}pt
              </p>
              <ul className="finish__list">
                {checklist.map((c) => (
                  <li key={c.label} className={c.ok ? "ok" : ""}>
                    <span>{c.label}</span>
                    {!c.ok && (
                      <button
                        type="button"
                        className="finish__fix"
                        onClick={(e) => {
                          const origin = e.currentTarget.getBoundingClientRect();
                          close();
                          if ("track2" in c && c.track2) {
                            setTrack2Picker({ origin });
                            return;
                          }
                          const target = "extra" in c && c.extra ? lightest((i) => ledger[i]!.recognized) : lightest(creditsAt);
                          window.setTimeout(() => goTo(target), 450);
                        }}
                      >
                        {c.fix} →
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn--primary btn--shine btn--block finish__report"
                onClick={(e) => setReportOpen({ origin: e.currentTarget.getBoundingClientRect() })}
              >
                <span aria-hidden="true" className="btn__spark">✦</span> AI 취업 준비 분석 보기
              </button>
              <div className="card__actions">
                <button type="button" className="btn btn--ghost" onClick={(e) => setMyPage({ origin: e.currentTarget.getBoundingClientRect() })}>
                  학기별 기록 보기
                </button>
                <button type="button" className="btn btn--primary" onClick={close}>
                  계속 설계하기
                </button>
              </div>
              <button type="button" className="link-btn link-btn--sm" onClick={onReset}>
                처음부터 다시 시작
              </button>
            </div>
          )}
        </Genie>
      )}
    </div>
  );
}
