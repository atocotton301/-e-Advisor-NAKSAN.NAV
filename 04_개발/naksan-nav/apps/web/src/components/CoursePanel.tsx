import type React from "react";
import { AREA_KEY } from "../lib/areas";
import { useMemo, useState, type MouseEvent } from "react";
import { rankByInterest, type Recommendation } from "../lib/recommend";
import { EXTRA_RULE, type ExtraRow } from "../lib/extracurricular";
import { REQ } from "../lib/requirements";
import {
  clashesWith,
  describeSlots,
  overlaps,
  placedSectionIndex,
  sectionEntries,
  secLabel,
  sectionIndexesFor,
  sectionsOf,
  type SectionLike,
  type TimetableEntry,
} from "../lib/timetable";
import type { Activity, Category, Course, SemesterPlan } from "../types";

type Tab = "major" | "liberal" | "general" | "extra";

const TABS: { id: Tab; label: string }[] = [
  { id: "major", label: "전공" },
  { id: "liberal", label: "교양" },
  { id: "general", label: "일반선택" },
  { id: "extra", label: "비교과" },
];

const CATEGORY_ORDER: Category[] = ["전공기초", "전공필수", "전공선택", "필수교양", "선택필수교양", "일반선택"];

interface Group {
  title: string;
  courses: Course[];
}

interface CoursePanelProps {
  semesterLabel: string;
  grade: number;
  /** 1학기 또는 2학기 */
  term: 1 | 2;
  isLast: boolean;
  /** 이미 지나온 학기를 다시 고치는 중 */
  revisiting: boolean;
  /** 이번 학기 비교과 인정·이월·소멸 */
  extra: ExtraRow;
  /** 지난 학기에 이미 들은 과목을 뺀 목록 */
  courses: Course[];
  activities: Activity[];
  plan: SemesterPlan;
  interests: string[];
  hasTrack2: boolean;
  credits: number;
  limit: import("../lib/creditLimit").CreditLimit;
  points: number;
  shake: number;
  toast: string | null;
  busy: boolean;
  onToggleCourse: (course: Course) => void;
  /** 이번 학기 시간표. 분반을 고르면 여기에 들어간다. */
  timetable: TimetableEntry[];
  onPickSection: (course: Course, index: number) => void;
  onOpenTimetable: (origin: DOMRect) => void;
  onToggleActivity: (id: string) => void;
  onOpenSyllabus: (course: Course, origin: DOMRect) => void;
  onOpenReviews: (activity: Activity, origin: DOMRect) => void;
  reviewCounts: Record<string, number>;
  onConfirm: (origin: DOMRect) => void;
}

function byCategoryThenRank(ranks: Map<string, Recommendation>) {
  return (a: Course, b: Course) =>
    CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
    (ranks.get(a.id)?.rank ?? 999) - (ranks.get(b.id)?.rank ?? 999);
}

export function CoursePanel(props: CoursePanelProps) {
  const { grade, term, courses, activities, plan, interests, credits, points } = props;
  const [tab, setTab] = useState<Tab>("major");

  const groups = useMemo((): Record<Exclude<Tab, "extra">, Group[]> => {
    // 전공은 이번 학기(1·2학기)에 열리는 과목만 보여준다.
    const major = courses.filter((c) => c.trackSlot && c.grade <= grade && (c.term ?? term) === term);
    const liberal = courses.filter((c) => c.category === "필수교양" || c.category === "선택필수교양");
    const general = courses.filter((c) => c.category === "일반선택");
    const majorRanks = rankByInterest(major.filter((c) => c.grade === grade), interests);
    const liberalRanks = rankByInterest(liberal, interests);
    const sortMajor = byCategoryThenRank(majorRanks);

    return {
      major: [
        { title: `${grade}학년 ${term}학기 전공`, courses: major.filter((c) => c.grade === grade).sort(sortMajor) },
        { title: `지난 학년 미이수 전공 · ${term}학기 개설`, courses: major.filter((c) => c.grade < grade).sort(sortMajor) },
      ],
      liberal: [
        { title: `필수교양 · ${term}학기 배정`, courses: liberal.filter((c) => c.category === "필수교양" && (c.term ?? term) === term) },
        { title: "필수교양 · 다른 학기 배정 (못 들었으면 이번에)", courses: liberal.filter((c) => c.category === "필수교양" && (c.term ?? term) !== term) },
        {
          title: "선택필수교양 · 3개 분야 이상",
          courses: liberal.filter((c) => c.category === "선택필수교양").sort(byCategoryThenRank(liberalRanks)),
        },
      ],
      general: [{ title: "일반선택", courses: general }],
    };
  }, [courses, grade, term, interests]);

  const ranks = useMemo(() => {
    if (tab === "extra") return rankByInterest(activities, interests);
    const visible = groups[tab].flatMap((g) => g.courses);
    // 전공 탭은 이번 학년 과목끼리만 순위를 매긴다.
    return rankByInterest(tab === "major" ? visible.filter((c) => c.grade === grade) : visible, interests);
  }, [tab, groups, activities, interests, grade]);

  const countIn = (t: Tab) =>
    t === "extra"
      ? plan.activityIds.length
      : plan.courseIds.filter((id) => groups[t].some((g) => g.courses.some((c) => c.id === id))).length;

  const lim = props.limit;
  const over = credits > lim.base;
  const placedCount = new Set(props.timetable.map((e) => e.name)).size;
  const clashCount = overlaps(props.timetable).size;
  const fill = Math.min(credits / Math.max(lim.limit, REQ.maxCreditsPerSemester), 1) * 100;

  return (
    <div className="course-panel">
      <div className="course-panel__tabs" role="tablist">
        {TABS.map((t) => {
          const n = countIn(t.id);
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {n > 0 && <span className="tab__count">{n}</span>}
            </button>
          );
        })}
      </div>

      <div className="course-panel__list" key={tab}>
        {tab === "extra" ? (
          <ActivityList activities={activities} ranks={ranks} selected={plan.activityIds} onToggle={props.onToggleActivity} onOpenReviews={props.onOpenReviews} reviewCounts={props.reviewCounts} />
        ) : (
          groups[tab]
            .filter((g) => g.courses.length > 0)
            .map((g) => (
              <section key={g.title} className="course-group">
                <h4>{g.title}</h4>
                {g.courses.map((c, idx) => (
                  <CourseRow
                    index={idx}
                    key={c.id}
                    course={c}
                    rec={ranks.get(c.id)}
                    selected={plan.courseIds.includes(c.id)}
                    showTrack={props.hasTrack2}
                    term={term}
                    timetable={props.timetable}
                    onToggle={() => props.onToggleCourse(c)}
                    onPickSection={(i) => props.onPickSection(c, i)}
                    onOpen={(e) => props.onOpenSyllabus(c, e.currentTarget.getBoundingClientRect())}
                  />
                ))}
              </section>
            ))
        )}
      </div>

      <footer className="course-panel__foot">
        <div key={props.shake} className={`meter ${props.shake ? "is-shaking" : ""}`}>
          <div className="meter__nums">
            <b className={over ? "is-over" : ""}>{credits}</b>
            <span>/ {REQ.baseCreditsPerSemester}학점</span>
            {(points > 0 || props.extra.carryIn > 0) && (
              <em title={`획득 ${props.extra.earned}pt + 이월 ${props.extra.carryIn}pt`}>
                비교과 인정 {props.extra.recognized}/{EXTRA_RULE.perSemester}pt
                {props.extra.carryOut > 0 && ` · 이월 ${props.extra.carryOut}`}
                {props.extra.lost > 0 && ` · 소멸 ${props.extra.lost}`}
              </em>
            )}
          </div>
          <div className="meter__bar">
            <span className={`meter__fill ${over ? "is-over" : ""}`} style={{ width: `${fill}%` }} />
            <span className="meter__tick" style={{ left: `${(lim.limit / Math.max(lim.limit, REQ.maxCreditsPerSemester)) * 100}%` }} />
          </div>
          <p className="meter__hint">
            {props.semesterLabel} 학기 · 최대 <b className={lim.honor || lim.carry ? "meter__plus" : lim.warning ? "meter__warn" : ""}>{lim.limit}학점</b>
            <small> · {lim.reason}</small>
          </p>
          <button type="button" className="link-btn tt-link" onClick={(e) => props.onOpenTimetable(e.currentTarget.getBoundingClientRect())}>
            🗓 이번 학기 시간표 보기
            {placedCount > 0 && ` · ${placedCount}과목`}
            {clashCount > 0 && <b className="tt-link__clash"> · 시간 겹침 있음</b>}
          </button>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--confirm"
          disabled={props.busy || credits === 0}
          title={credits === 0 ? "과목을 한 개 이상 담아야 이 학기를 결정할 수 있어요" : undefined}
          onClick={(e) => props.onConfirm(e.currentTarget.getBoundingClientRect())}
        >
          {credits === 0 ? "과목을 담아주세요" : props.revisiting ? "저장하고 다음 학기 →" : props.isLast ? "졸업 설계 완료" : "결정 →"}
        </button>
      </footer>
      {props.toast && <div className="toast">{props.toast}</div>}
    </div>
  );
}

interface CourseRowProps {
  index?: number;
  course: Course;
  rec?: Recommendation;
  selected: boolean;
  showTrack: boolean;
  term: 1 | 2;
  timetable: TimetableEntry[];
  onToggle: () => void;
  onPickSection: (index: number) => void;
  onOpen: (e: MouseEvent<HTMLButtonElement>) => void;
}

function CourseRow({ course, rec, selected, showTrack, term, timetable, onToggle, onPickSection, onOpen, index = 0 }: CourseRowProps) {
  const sections = sectionsOf(course);
  const indexes = sectionIndexesFor(sections, term);
  return (
    <div
      className={`course-row ${indexes.length ? "has-secs" : ""} ${selected ? "is-selected" : ""} ${rec?.gold ? "is-gold" : ""}`}
      style={{ "--i": Math.min(index, 12) } as React.CSSProperties}
    >
      <button type="button" className="course-row__main" aria-pressed={selected} onClick={onToggle}>
        <span className="check" aria-hidden>
          {selected ? "✓" : ""}
        </span>
        <span className="course-row__text">
          <span className="course-row__name">
            {course.name}
            {rec && <span className={`rank ${rec.gold ? "rank--gold" : ""}`}>추천 #{rec.rank}</span>}
          </span>
          <span className="course-row__meta">
            <span className={`cat cat--${course.category}`}>{course.category}</span>
            {showTrack && course.trackSlot && <span className="cat">{course.trackSlot}트랙</span>}
            {course.group && course.category === "선택필수교양" && <span className={`achip achip--${AREA_KEY[course.group] ?? "etc"}`}>{course.group}</span>}
            {course.source && course.source !== "sample" && (
              <span className="src src--real">{course.source === "official" ? "공식 교육과정" : "2026-2 개설"}</span>
            )}
            {course.source === "sample" && <span className="src">샘플</span>}
            {rec && <span className="matched">{rec.matched.map((t) => `#${t}`).join(" ")}</span>}
          </span>
        </span>
        <span className="course-row__credits">{course.credits}학점</span>
      </button>
      <button type="button" className="syllabus-btn" onClick={onOpen}>
        계획서
      </button>
      {indexes.length > 0 && (
        <SectionBar name={course.name} sections={sections} indexes={indexes} timetable={timetable} onPick={onPickSection} />
      )}
    </div>
  );
}

const profOf = (s: SectionLike) => s.prof || "미정";

interface SectionBarProps {
  name: string;
  sections: SectionLike[];
  /** 이번 학기에 열리는 분반의 인덱스 */
  indexes: number[];
  timetable: TimetableEntry[];
  onPick: (index: number) => void;
}

/** 분반 요약 한 줄. 펼치면 교수별로 거르고 시간·강의실·시간 겹침을 보며 분반을 고른다. */
function SectionBar({ name, sections, indexes, timetable, onPick }: SectionBarProps) {
  const [open, setOpen] = useState(false);
  const [prof, setProf] = useState<string | null>(null);
  const picked = placedSectionIndex(name, sections, timetable);
  const current = picked >= 0 ? sections[picked] : undefined;
  const profs = [...new Set(indexes.map((i) => profOf(sections[i]!)))];
  const others = timetable.filter((e) => e.name !== name);
  const shown = prof ? indexes.filter((i) => profOf(sections[i]!) === prof) : indexes;

  return (
    <div className="sec-bar">
      <button type="button" className="sec-bar__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {current ? (
          <span>
            <b>✓ {secLabel(current)}반</b> {profOf(current)} · {describeSlots(current.time) || "온라인 강좌"}
          </span>
        ) : (
          <span>
            분반 {indexes.length}개 · {profs.slice(0, 2).join(", ")}
            {profs.length > 2 && ` 외 ${profs.length - 2}명`}
          </span>
        )}
        <span className="sec-bar__hint">{open ? "접기 ▴" : current ? "바꾸기 ▾" : "교수·시간 보고 고르기 ▾"}</span>
      </button>
      {open && (
        <div className="sec-picker">
          {profs.length > 1 && (
            <div className="sec-picker__profs" role="group" aria-label="교수로 거르기">
              <button type="button" className={prof ? "" : "is-on"} aria-pressed={!prof} onClick={() => setProf(null)}>
                전체 <small>{indexes.length}</small>
              </button>
              {profs.map((p) => (
                <button key={p} type="button" className={prof === p ? "is-on" : ""} aria-pressed={prof === p} onClick={() => setProf(p)}>
                  {p} <small>{indexes.filter((i) => profOf(sections[i]!) === p).length}</small>
                </button>
              ))}
            </div>
          )}
          <ul className="sec-picker__list">
            {shown.map((i) => {
              const s = sections[i]!;
              const clash = clashesWith(sectionEntries(name, s), others);
              return (
                <li key={i}>
                  <button type="button" className={`sec-opt ${i === picked ? "is-on" : ""}`} aria-pressed={i === picked} onClick={() => onPick(i)}>
                    <b className="sec-opt__sec">{secLabel(s)}</b>
                    <span className="sec-opt__prof">{profOf(s)}</span>
                    <span className="sec-opt__time">{describeSlots(s.time) || "온라인 강좌"}</span>
                    <span className="sec-opt__room">{s.room}</span>
                    {clash.length > 0 && <em className="sec-opt__clash">겹침 · {clash.join(", ")}</em>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

interface ActivityListProps {
  activities: Activity[];
  ranks: Map<string, Recommendation>;
  selected: string[];
  onToggle: (id: string) => void;
  onOpenReviews: (activity: Activity, origin: DOMRect) => void;
  reviewCounts: Record<string, number>;
}

function ActivityList({ activities, ranks, selected, onToggle, onOpenReviews, reviewCounts }: ActivityListProps) {
  const sorted = [...activities].sort((a, b) => (ranks.get(a.id)?.rank ?? 999) - (ranks.get(b.id)?.rank ?? 999));
  return (
    <section className="course-group">
      <h4>이번 학기 비교과 · 졸업까지 {REQ.extraPoints}pt · 한 학기 {EXTRA_RULE.perSemester}pt까지 인정</h4>
      {sorted.map((a) => {
        const rec = ranks.get(a.id);
        const on = selected.includes(a.id);
        return (
          <div key={a.id} className={`course-row ${on ? "is-selected" : ""} ${rec?.gold ? "is-gold" : ""}`}>
            <button type="button" className="course-row__main" aria-pressed={on} onClick={() => onToggle(a.id)}>
              <span className="check" aria-hidden>
                {on ? "✓" : ""}
              </span>
              <span className="course-row__text">
                <span className="course-row__name">
                  {a.name}
                  {rec && <span className={`rank ${rec.gold ? "rank--gold" : ""}`}>추천 #{rec.rank}</span>}
                </span>
                <span className="course-row__meta">
                  <span className="cat cat--비교과">{a.host}</span>
                  {rec && <span className="matched">{rec.matched.map((t) => `#${t}`).join(" ")}</span>}
                </span>
              </span>
              <span className="course-row__credits">{a.points}pt</span>
            </button>
            <button type="button" className="syllabus-btn" onClick={(e) => onOpenReviews(a, e.currentTarget.getBoundingClientRect())}>
              후기{reviewCounts[a.id] ? ` ${reviewCounts[a.id]}` : ""}
            </button>
          </div>
        );
      })}
    </section>
  );
}
