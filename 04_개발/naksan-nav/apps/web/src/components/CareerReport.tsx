import { useEffect, useMemo, useState } from "react";
import { competencies, JOBS, rankJobs } from "../lib/career";
import type { ExtraRow } from "../lib/extracurricular";
import { REQ, type RequirementStatus } from "../lib/requirements";
import type { Activity, Course, Student } from "../types";
import { Boogi } from "./Boogi";
import { useTilt } from "../lib/useTilt";

const SEM = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

interface Sem {
  courses: Course[];
  activities: Activity[];
  extra: ExtraRow;
}

interface CareerReportProps {
  student: Student;
  semesters: Sem[];
  catalogCourses: Course[];
  catalogActivities: Activity[];
  status: RequirementStatus;
  gpa: number | null;
  onGoSemester: (i: number) => void;
}

const STEPS = ["8학기 수강 계획 읽는 중", "과목·비교과를 역량으로 바꾸는 중", `직무 ${JOBS.length}개와 비교하는 중`, "준비 로드맵 만드는 중"];

export function CareerReport({ student, semesters, catalogCourses, catalogActivities, status, gpa, onGoSemester }: CareerReportProps) {
  const tilt = useTilt<HTMLElement>(5);
  const [step, setStep] = useState(0);
  const [jobIdx, setJobIdx] = useState(0);
  useEffect(() => {
    if (step >= STEPS.length) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), 520);
    return () => window.clearTimeout(t);
  }, [step]);

  const courses = useMemo(() => semesters.flatMap((s) => s.courses), [semesters]);
  const acts = useMemo(() => semesters.flatMap((s) => s.activities), [semesters]);
  const comp = useMemo(() => competencies(courses, acts), [courses, acts]);
  const jobs = useMemo(() => rankJobs(comp, student.interests), [comp, student.interests]);
  const top = jobs.slice(0, 3);
  const pick = top[jobIdx] ?? top[0]!;

  const planned = new Set(courses.map((c) => c.id));
  const plannedActs = new Set(acts.map((a) => a.id));
  const recCourses = catalogCourses
    .filter((c) => !planned.has(c.id) && c.tags.some((t) => pick.missing.includes(t) || pick.job.core.includes(t)))
    .sort((a, b) => Number(!!b.trackSlot) - Number(!!a.trackSlot) || b.credits - a.credits)
    .slice(0, 4);
  const recActs = catalogActivities.filter((a) => !plannedActs.has(a.id) && a.tags.some((t) => pick.job.core.includes(t))).slice(0, 3);

  const maxScore = Math.max(...comp.slice(0, 8).map((c) => c.score), 1);
  const majorCredits = courses.filter((c) => c.trackSlot).reduce((a, c) => a + c.credits, 0);
  const totalCredits = courses.reduce((a, c) => a + c.credits, 0);
  const majorShare = totalCredits ? Math.round((majorCredits / totalCredits) * 100) : 0;
  const persona = comp.length >= 2 ? `#${comp[0]!.tag} × #${comp[1]!.tag} 융합형` : comp[0] ? `#${comp[0].tag} 집중형` : "탐색형";
  const lost = semesters.reduce((a, s) => a + s.extra.lost, 0);
  const lateActs = semesters.slice(4).reduce((a, s) => a + s.activities.length, 0);

  const risks: { level: "warn" | "ok"; text: string; sem?: number }[] = [];
  semesters.forEach((s, i) => {
    const cr = s.courses.reduce((a, c) => a + c.credits, 0);
    if (cr >= 21) risks.push({ level: "warn", text: `${SEM[i]} ${cr}학점 — 학기가 무거워요. 한두 과목을 다른 학기로 옮겨 보세요.`, sem: i });
    if (cr > 0 && cr < 12) risks.push({ level: "warn", text: `${SEM[i]} ${cr}학점 — 너무 가벼워서 다른 학기에 몰릴 수 있어요.`, sem: i });
  });
  if (lost) risks.push({ level: "warn", text: `비교과 ${lost}pt가 소멸돼요. 400pt를 넘는 학기의 활동을 다른 학기로 나눠 보세요.` });
  if (!student.track2) risks.push({ level: "warn", text: "제2트랙을 아직 고르지 않았어요. 위 직무와 맞는 트랙을 고르면 졸업요건과 취업 준비를 같이 채울 수 있어요." });
  if (majorShare > 75) risks.push({ level: "warn", text: `전공 비중이 ${majorShare}%로 높아요. 교양 영역 학점을 다시 확인해 보세요.` });
  if (lateActs === 0) risks.push({ level: "warn", text: "3~4학년 비교과가 비어 있어요. 이 시기의 공모전·인턴 경험이 이력서에 가장 많이 쓰여요." });
  if (gpa !== null && gpa < 3.0) risks.push({ level: "warn", text: `평점 ${gpa.toFixed(2)} — 서류 기준(보통 3.0 이상)을 넘기려면 재수강을 고려해 보세요.` });
  if (!risks.length) risks.push({ level: "ok", text: "학기별 학점·비교과 배분이 고르게 잡혀 있어요." });

  const firstCert = pick.job.certs[0];
  const secondCert = pick.job.certs[1];
  const plan = [
    { when: "1~2학년", what: `기초를 다지는 시기. 지금 계획의 ${pick.evidence.slice(0, 2).join(", ") || "기초 전공"}을 성실히 듣고 관련 동아리·학습공동체에 들어가요.` },
    { when: "3-1", what: firstCert ? `${firstCert.name} 준비 시작 (필기부터)` : "직무 관련 프로젝트 하나를 시작해요." },
    { when: "3학년 여름방학", what: "현장실습·인턴(학기제 포함)이나 부트캠프 1개 지원" },
    { when: "3-2", what: `포트폴리오: ${pick.job.portfolio}` },
    { when: "4-1", what: `${secondCert ? `${secondCert.name} 취득, ` : ""}이력서·자기소개서 초안, 어학 성적 마무리` },
    { when: "4-2", what: "하반기 공채·수시 지원, 면접 준비. 졸업예정증명서는 이 학기에 떼요." },
  ];

  if (step < STEPS.length) {
    return (
      <div className="cr cr--loading">
        <Boogi pose="side" running scale={3} />
        <h2>AI 취업 준비 분석</h2>
        <ul className="cr__steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i < step ? "done" : i === step ? "now" : ""}>
              {i < step ? "✓" : i === step ? "…" : "·"} {s}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="cr">
      <header ref={tilt.ref} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave} className="cr__hero tilt">
        <span className="tilt__glare" aria-hidden="true" />
        <div>
          <span className="cr__kicker">✦ AI 취업 준비 분석</span>
          <h2>{persona} 인재</h2>
          <p>
            8학기 {totalCredits}학점 · 전공 {majorShare}% · 비교과 인정 {status.extraPoints.have}pt
            {gpa !== null && ` · 평점 ${gpa.toFixed(2)}`}
          </p>
        </div>
        <Boogi pose="front" variant="grad" scale={3} />
      </header>

      <section className="cr__sec">
        <h3>나와 잘 맞는 직무 Top 3</h3>
        <div className="cr__jobs" role="tablist">
          {top.map((j, i) => (
            <button key={j.job.name} type="button" role="tab" aria-selected={i === jobIdx} className={`cr__job ${i === jobIdx ? "is-on" : ""}`} onClick={() => setJobIdx(i)}>
              <span className="cr__rank">{i + 1}</span>
              <b>{j.job.name}</b>
              <span className="cr__fit">
                <span style={{ width: `${j.fit}%` }} />
              </span>
              <small>적합도 {j.fit}%</small>
            </button>
          ))}
        </div>

        <div className="cr__detail">
          <div>
            <h4>이미 갖춘 역량</h4>
            <div className="cr__tags">
              {pick.have.length ? pick.have.map((h) => <span key={h.tag} className="cr__tag cr__tag--have">#{h.tag}</span>) : <span className="cr__none">아직 없어요</span>}
            </div>
            {pick.evidence.length > 0 && <p className="cr__ev">근거 과목·활동: {pick.evidence.join(", ")}</p>}
          </div>
          <div>
            <h4>채워야 할 역량</h4>
            <div className="cr__tags">
              {pick.missing.length ? pick.missing.map((m) => <span key={m} className="cr__tag cr__tag--miss">#{m}</span>) : <span className="cr__none">핵심 역량을 모두 갖췄어요</span>}
            </div>
          </div>
        </div>

        <div className="cr__recs">
          <div>
            <h4>더 담으면 좋은 과목</h4>
            <ul>
              {recCourses.length ? recCourses.map((c) => (
                <li key={c.id}>
                  <b>{c.name}</b> <small>{c.category} · {c.grade ? `${c.grade}학년` : "전 학년"} · {c.credits}학점</small>
                </li>
              )) : <li className="cr__none">지금 계획으로 충분해요</li>}
            </ul>
          </div>
          <div>
            <h4>추천 비교과</h4>
            <ul>
              {recActs.length ? recActs.map((a) => (
                <li key={a.id}>
                  <b>{a.name}</b> <small>{a.host} · {a.points}pt</small>
                </li>
              )) : <li className="cr__none">관련 비교과를 이미 담았어요</li>}
            </ul>
          </div>
          <div>
            <h4>자격증</h4>
            <ul>
              {pick.job.certs.length ? pick.job.certs.map((c) => (
                <li key={c.name}>
                  <a href={c.url} target="_blank" rel="noreferrer">{c.name} ↗</a>
                </li>
              )) : <li className="cr__none">자격증보다 포트폴리오가 중요한 직무예요</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="cr__sec">
        <h3>내 역량 프로필</h3>
        <ul className="cr__bars">
          {comp.slice(0, 8).map((c, i) => (
            <li key={c.tag}>
              <span>#{c.tag}</span>
              <span className="cr__bar">
                <span style={{ width: `${(c.score / maxScore) * 100}%`, animationDelay: `${i * 60}ms` }} />
              </span>
              <small>{c.courses.length}개 과목·활동</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="cr__sec">
        <h3>학기별 부하</h3>
        <div className="cr__load">
          {semesters.map((s, i) => {
            const maj = s.courses.filter((c) => c.trackSlot).reduce((a, c) => a + c.credits, 0);
            const lib = s.courses.reduce((a, c) => a + c.credits, 0) - maj;
            return (
              <button key={i} type="button" className="cr__col" onClick={() => onGoSemester(i)} title={`${SEM[i]}로 이동`}>
                <span className="cr__stack">
                  <span className="cr__lib" style={{ height: `${(lib / REQ.maxCreditsPerSemester) * 100}%` }} />
                  <span className="cr__maj" style={{ height: `${(maj / REQ.maxCreditsPerSemester) * 100}%` }} />
                </span>
                <b>{maj + lib}</b>
                <small>{SEM[i]}</small>
                <em>{s.extra.recognized}pt</em>
              </button>
            );
          })}
        </div>
        <p className="cr__legend">
          <i className="cr__maj" /> 전공 <i className="cr__lib" /> 교양·일반 · 아래 숫자는 비교과 인정 포인트 · 막대를 누르면 그 학기로 가요
        </p>
      </section>

      <section className="cr__sec">
        <h3>점검할 점</h3>
        <ul className="cr__risks">
          {risks.map((r) => (
            <li key={r.text} className={`cr__risk cr__risk--${r.level}`}>
              {r.text}
              {r.sem !== undefined && (
                <button type="button" className="link-btn" onClick={() => onGoSemester(r.sem!)}>
                  고치러 가기 →
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="cr__sec">
        <h3>{pick.job.name} 준비 로드맵</h3>
        <ol className="cr__plan">
          {plan.map((p) => (
            <li key={p.when}>
              <b>{p.when}</b>
              <span>{p.what}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="cr__note">
        지금 분석은 과목·비교과에 붙은 역량 태그를 직무별 핵심 역량과 비교하는 규칙 기반 계산이에요. 실제 서비스에서는 팀 서버의 AI가 채용공고와
        직무기술서(NCS)를 함께 읽어 더 정확하게 비교할 예정이에요.
      </p>
    </div>
  );
}
