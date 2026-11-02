import { useMemo, useState, type MouseEvent } from "react";
import { rankByInterest, type Recommendation } from "../lib/recommend";
import { REQ } from "../lib/requirements";
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
  isLast: boolean;
  /** 지난 학기에 이미 들은 과목을 뺀 목록 */
  courses: Course[];
  activities: Activity[];
  plan: SemesterPlan;
  interests: string[];
  hasTrack2: boolean;
  credits: number;
  points: number;
  shake: number;
  toast: string | null;
  busy: boolean;
  onToggleCourse: (course: Course) => void;
  onToggleActivity: (id: string) => void;
  onOpenSyllabus: (course: Course, origin: DOMRect) => void;
  onConfirm: (origin: DOMRect) => void;
}

function byCategoryThenRank(ranks: Map<string, Recommendation>) {
  return (a: Course, b: Course) =>
    CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
    (ranks.get(a.id)?.rank ?? 999) - (ranks.get(b.id)?.rank ?? 999);
}

export function CoursePanel(props: CoursePanelProps) {
  const { grade, courses, activities, plan, interests, credits, points } = props;
  const [tab, setTab] = useState<Tab>("major");

  const groups = useMemo((): Record<Exclude<Tab, "extra">, Group[]> => {
    const major = courses.filter((c) => c.trackSlot && c.grade <= grade);
    const liberal = courses.filter((c) => c.category === "필수교양" || c.category === "선택필수교양");
    const general = courses.filter((c) => c.category === "일반선택");
    const majorRanks = rankByInterest(major.filter((c) => c.grade === grade), interests);
    const liberalRanks = rankByInterest(liberal, interests);
    const sortMajor = byCategoryThenRank(majorRanks);

    return {
      major: [
        { title: `${grade}학년 전공`, courses: major.filter((c) => c.grade === grade).sort(sortMajor) },
        { title: "지난 학년 미이수 전공", courses: major.filter((c) => c.grade < grade).sort(sortMajor) },
      ],
      liberal: [
        { title: "필수교양(기초)", courses: liberal.filter((c) => c.category === "필수교양") },
        {
          title: "선택필수교양 · 3개 분야 이상",
          courses: liberal.filter((c) => c.category === "선택필수교양").sort(byCategoryThenRank(liberalRanks)),
        },
      ],
      general: [{ title: "일반선택", courses: general }],
    };
  }, [courses, grade, interests]);

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

  const over = credits > REQ.baseCreditsPerSemester;
  const fill = Math.min(credits / REQ.maxCreditsPerSemester, 1) * 100;

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
          <ActivityList activities={activities} ranks={ranks} selected={plan.activityIds} onToggle={props.onToggleActivity} />
        ) : (
          groups[tab]
            .filter((g) => g.courses.length > 0)
            .map((g) => (
              <section key={g.title} className="course-group">
                <h4>{g.title}</h4>
                {g.courses.map((c) => (
                  <CourseRow
                    key={c.id}
                    course={c}
                    rec={ranks.get(c.id)}
                    selected={plan.courseIds.includes(c.id)}
                    showTrack={props.hasTrack2}
                    onToggle={() => props.onToggleCourse(c)}
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
            {points > 0 && <em>+{points}pt</em>}
          </div>
          <div className="meter__bar">
            <span className={`meter__fill ${over ? "is-over" : ""}`} style={{ width: `${fill}%` }} />
            <span className="meter__tick" style={{ left: `${(REQ.baseCreditsPerSemester / REQ.maxCreditsPerSemester) * 100}%` }} />
          </div>
          <p className="meter__hint">
            {over ? `초과 수강 중 · 최대 ${REQ.maxCreditsPerSemester}학점` : `${props.semesterLabel} 학기 · 최대 ${REQ.maxCreditsPerSemester}학점`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--confirm"
          disabled={props.busy}
          onClick={(e) => props.onConfirm(e.currentTarget.getBoundingClientRect())}
        >
          {props.isLast ? "졸업 설계 완료" : credits === 0 ? "이번 학기 쉬기 →" : "결정 →"}
        </button>
      </footer>
      {props.toast && <div className="toast">{props.toast}</div>}
    </div>
  );
}

interface CourseRowProps {
  course: Course;
  rec?: Recommendation;
  selected: boolean;
  showTrack: boolean;
  onToggle: () => void;
  onOpen: (e: MouseEvent<HTMLButtonElement>) => void;
}

function CourseRow({ course, rec, selected, showTrack, onToggle, onOpen }: CourseRowProps) {
  return (
    <div className={`course-row ${selected ? "is-selected" : ""} ${rec?.gold ? "is-gold" : ""}`}>
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
            {course.group && course.category === "선택필수교양" && <span className="cat">{course.group}</span>}
            {rec && <span className="matched">{rec.matched.map((t) => `#${t}`).join(" ")}</span>}
          </span>
        </span>
        <span className="course-row__credits">{course.credits}학점</span>
      </button>
      <button type="button" className="syllabus-btn" onClick={onOpen}>
        계획서
      </button>
    </div>
  );
}

interface ActivityListProps {
  activities: Activity[];
  ranks: Map<string, Recommendation>;
  selected: string[];
  onToggle: (id: string) => void;
}

function ActivityList({ activities, ranks, selected, onToggle }: ActivityListProps) {
  const sorted = [...activities].sort((a, b) => (ranks.get(a.id)?.rank ?? 999) - (ranks.get(b.id)?.rank ?? 999));
  return (
    <section className="course-group">
      <h4>이번 학기 비교과 · 졸업까지 {REQ.extraPoints}pt</h4>
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
          </div>
        );
      })}
    </section>
  );
}
