import type { MouseEvent } from "react";
import { AREA_KEY } from "../lib/areas";
import { EXTRA_RULE, type ExtraRow } from "../lib/extracurricular";
import type { CalendarSemester, GraduationDate } from "../lib/leave";
import type { Progress, RequirementStatus } from "../lib/requirements";
import { gpa, type Grade } from "../lib/transcript";
import type { Course, Student } from "../types";
import { Boogi } from "./Boogi";
import { OFFICIAL_LINKS } from "../data/hansung";

interface SemesterSummary {
  label: string;
  courses: Course[];
  extra: ExtraRow;
  hasTimetable: boolean;
  memo: string;
}

interface MyPageProps {
  student: Student;
  version: string;
  status: RequirementStatus;
  semesters: SemesterSummary[];
  grades: Record<string, Grade>;
  current: number;
  calendar: CalendarSemester[];
  graduation: GraduationDate;
  onGoSemester: (i: number) => void;
  onOpenTimetable: (origin: DOMRect) => void;
  onOpenTranscript: (origin: DOMRect) => void;
  onOpenGraduation: (origin: DOMRect) => void;
}

const rect = (e: MouseEvent<HTMLButtonElement>) => e.currentTarget.getBoundingClientRect();
const pct = (p: Progress) => (p.need ? Math.min(p.have / p.need, 1) : 1);

const CAT_SHORT: Record<Course["category"], string> = {
  필수교양: "교필",
  선택필수교양: "선필교",
  일반선택: "일선",
  전공기초: "전기",
  전공필수: "전필",
  전공선택: "전선",
};

function Ring({ p, label, unit, color }: { p: Progress; label: string; unit: string; color: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring">
      <svg viewBox="0 0 84 84" aria-hidden="true">
        <circle cx="42" cy="42" r={r} className="ring__bg" />
        <circle cx="42" cy="42" r={r} className="ring__fg" style={{ stroke: color, strokeDasharray: c, strokeDashoffset: c * (1 - pct(p)) }} />
      </svg>
      <div className="ring__txt">
        <b>{p.have}</b>
        <small>
          /{p.need}
          {unit}
        </small>
      </div>
      <span className="ring__label">{label}</span>
    </div>
  );
}

function Bar({ p, label }: { p: Progress; label: string }) {
  return (
    <div className={`mbar ${p.have >= p.need ? "is-met" : ""}`}>
      <span className="mbar__label">{label}</span>
      <span className="mbar__track">
        <span style={{ width: `${pct(p) * 100}%` }} />
      </span>
      <span className="mbar__num">
        {p.have}/{p.need}
      </span>
    </div>
  );
}

export function MyPage({
  student,
  version,
  status,
  semesters,
  grades,
  current,
  calendar,
  graduation,
  onGoSemester,
  onOpenTimetable,
  onOpenTranscript,
  onOpenGraduation,
}: MyPageProps) {
  const all = semesters.flatMap((s) => s.courses);
  const graded = all.filter((c) => grades[c.id]);
  const avg = gpa(graded.map((c) => ({ credits: c.credits, grade: grades[c.id]! })));
  const byCat = (Object.keys(CAT_SHORT) as Course["category"][]).map((cat) => ({
    cat,
    credits: all.filter((c) => c.category === cat).reduce((a, c) => a + c.credits, 0),
  }));
  const semGpas = semesters.map((s) => {
    const g = s.courses.filter((c) => grades[c.id]);
    return gpa(g.map((c) => ({ credits: c.credits, grade: grades[c.id]! })));
  });
  const admission = student.admission?.kind ?? "신입학";

  // 휴학 학기까지 포함해 실제 달력 순서로 카드를 늘어놓는다
  const cards = calendar.filter((c) => c.leave || (c.study !== undefined && c.study < semesters.length));

  return (
    <div className="mp">
      <header className="mp__hero">
        <div className="mp__who">
          <Boogi pose="front" variant="wave" scale={3} />
          <div>
            <span className="mp__kicker">
              {admission} · {student.entryYear}학년도 입학 · {version} 졸업요건
            </span>
            <h2>{student.studentId}</h2>
            <div className="mp__chips">
              <span className="mp__chip">제1트랙 {student.track1.track.name}</span>
              <span className="mp__chip mp__chip--ghost">{student.track2 ? `제2트랙 ${student.track2.track.name}` : "제2트랙 미선택"}</span>
              <button type="button" className="mp__chip mp__chip--grad" onClick={(e) => onOpenGraduation(rect(e))}>
                🎓 {graduation.label} 예정
              </button>
            </div>
            <div className="mp__tags">
              {student.interests.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mp__rings">
          <Ring p={status.totalCredits} label="졸업학점" unit="" color="#5aa0ff" />
          <Ring p={status.majorTotal} label="전공" unit="" color="#a78bfa" />
          <Ring p={status.extraPoints} label="비교과" unit="pt" color="#fbbf24" />
          <div className="mp__gpa">
            <span>평점평균</span>
            <b>{avg?.toFixed(2) ?? "—"}</b>
            <small>/ 4.5 {graded.length ? `· ${graded.length}과목` : ""}</small>
          </div>
        </div>
      </header>

      <section className="mp__sec">
        <h3>이수구분별 학점</h3>
        <div className="mp__cats">
          {byCat.map((b) => (
            <div key={b.cat} className={`mp__cat mp__cat--${CAT_SHORT[b.cat]}`}>
              <span>{CAT_SHORT[b.cat]}</span>
              <b>{b.credits}</b>
              <small>{b.cat}</small>
            </div>
          ))}
          <div className="mp__cat mp__cat--total">
            <span>합계</span>
            <b>{status.totalCredits.have}</b>
            <small>/ {status.totalCredits.need}학점</small>
          </div>
        </div>
      </section>

      <section className="mp__sec mp__two">
        <div className="mp__panel">
          <h3>교양 이수 현황</h3>
          {status.liberalBasic.map((r) => (
            <Bar key={r.label} p={r} label={r.label} />
          ))}
          <div className="mp__areas">
            {status.areas.map((a) => (
              <span key={a.name} className={`achip ${a.credits ? `achip--${AREA_KEY[a.name] ?? "etc"}` : "achip--etc"}`}>
                {a.name} {a.credits}
              </span>
            ))}
          </div>
          <Bar p={status.areaCredits} label="선택필수교양 학점" />
        </div>
        <div className="mp__panel">
          <h3>전공 이수 현황</h3>
          <p className="mp__sub">제1트랙 · {student.track1.track.name}</p>
          <Bar p={status.track1.basic} label="전공기초" />
          <Bar p={status.track1.required} label="전공지정" />
          <Bar p={status.track1.total} label="전공소계" />
          {status.track2 && student.track2 ? (
            <>
              <p className="mp__sub">제2트랙 · {student.track2.track.name}</p>
              <Bar p={status.track2.total} label="전공소계" />
            </>
          ) : (
            <p className="mp__sub mp__sub--muted">제2트랙을 고르면 여기에 같이 보여요.</p>
          )}
        </div>
      </section>

      <section className="mp__sec">
        <h3>학기별 기록</h3>
        <div className="mp__sems">
          {cards.map((c, k) =>
            c.leave ? (
              <div key={`leave-${k}`} className="mp__sem mp__sem--leave">
                <header>
                  <b>{c.leave}휴학</b>
                  <span>
                    {c.year}년 {c.term}학기
                  </span>
                </header>
                <p>휴학 학기 · 비교과는 교내 인정 프로그램만 200pt까지</p>
              </div>
            ) : (
              (() => {
                const i = c.study!;
                const s = semesters[i]!;
                const cr = s.courses.reduce((a, x) => a + x.credits, 0);
                return (
                  <button key={s.label} type="button" className={`mp__sem ${i === current ? "is-current" : ""}`} onClick={() => onGoSemester(i)}>
                    <header>
                      <b>{s.label}</b>
                      <span>
                        {c.year}년 {c.term}학기
                      </span>
                    </header>
                    <div className="mp__semstats">
                      <span>
                        <b>{cr}</b>학점
                      </span>
                      <span>
                        <b>{semGpas[i]?.toFixed(2) ?? "—"}</b>평점
                      </span>
                      <span className={s.extra.lost ? "is-lost" : ""}>
                        <b>{s.extra.recognized}</b>pt{s.extra.carryOut ? ` (+${s.extra.carryOut} 이월)` : ""}
                      </span>
                    </div>
                    <ul className="mp__courses">
                      {s.courses.slice(0, 8).map((x) => (
                        <li key={x.id} className={`mp__course mp__course--${CAT_SHORT[x.category]}`}>
                          {x.name}
                          {grades[x.id] && <em>{grades[x.id]}</em>}
                        </li>
                      ))}
                      {s.courses.length > 8 && <li className="mp__more">+{s.courses.length - 8}</li>}
                    </ul>
                    {s.memo.trim() && <p className="mp__memo">“{s.memo.trim().slice(0, 60)}”</p>}
                    {s.hasTimetable && <span className="mp__tt">시간표 입력됨</span>}
                  </button>
                );
              })()
            ),
          )}
        </div>
        <p className="mypage__rule">
          비교과는 한 학기에 {EXTRA_RULE.perSemester}pt까지 인정돼요. {EXTRA_RULE.perSemester + 1}~{EXTRA_RULE.carryLimit}pt는 차액이 다음 학기로
          이월되고, {EXTRA_RULE.carryLimit}pt를 넘는 부분은 소멸돼요.
        </p>
      </section>

      <div className="mypage__actions">
        <button type="button" className="btn btn--ghost" onClick={(e) => onOpenTimetable(rect(e))}>
          시간표 입력
        </button>
        <button type="button" className="btn btn--primary" onClick={(e) => onOpenTranscript(rect(e))}>
          성적표 캡처로 입력
        </button>
      </div>

      <section className="mp__sec">
        <h3>한성대 공식 자료</h3>
        <div className="mypage__links">
          <a href={OFFICIAL_LINKS.curriculum} target="_blank" rel="noreferrer">교육과정 안내</a>
          <a href={OFFICIAL_LINKS.courseFlow} target="_blank" rel="noreferrer">이수체계</a>
          <a href={OFFICIAL_LINKS.registration} target="_blank" rel="noreferrer">수강신청 안내</a>
          <a href={OFFICIAL_LINKS.timetable} target="_blank" rel="noreferrer">시간표·수업계획서 조회</a>
          <a href={OFFICIAL_LINKS.certificateOnline} target="_blank" rel="noreferrer">인터넷 증명발급</a>
          <a href={OFFICIAL_LINKS.notices} target="_blank" rel="noreferrer">학사 공지사항</a>
        </div>
      </section>
      <p className="mypage__note">지금은 성적표 캡처나 직접 입력으로 넣어요. 한성대 종합정보시스템과 연동되면 로그인만으로 성적·이수내역이 들어와요.</p>
    </div>
  );
}
