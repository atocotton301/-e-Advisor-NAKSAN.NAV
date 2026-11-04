import { useMemo, useState } from "react";
import type { Course } from "../types";
import { convert, DAYS, overlaps, parseSlots, SLOT_CODES, toMin, type Day, type TimetableEntry } from "../lib/timetable";

interface TimetableViewProps {
  semesterLabel: string;
  /** 이번 학기에 담은 과목 이름 (입력 편의용) */
  courseNames: string[];
  /** 이번 학기에 담은 과목 (분반 정보가 있으면 자동 채우기) */
  courses: Course[];
  entries: TimetableEntry[];
  onChange: (entries: TimetableEntry[]) => void;
  /** 성적·수강 내역 캡처 입력 열기 */
  onOpenCapture?: (origin: DOMRect) => void;
}

const START = toMin("09:00");
const END = toMin("22:30");
const HOURS = Array.from({ length: 14 }, (_, i) => 9 + i);

let seq = 0;
const newId = () => `tt-${Date.now().toString(36)}-${seq++}`;

export function TimetableView({ semesterLabel, courseNames, courses, entries, onChange, onOpenCapture }: TimetableViewProps) {
  const withSections = courses.filter((c) => c.sections?.length);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const placed = (name: string) => entries.some((e) => e.name === name);
  const placeSection = (c: Course) => {
    const s = c.sections![picked[c.id] ?? 0]!;
    const { items } = parseSlots(s.time.replace(/\//g, " "));
    if (!items.length) return setError(`${c.name} ${s.sec}반 시간(${s.time})을 읽지 못했어요. 직접 입력해 주세요.`);
    onChange([
      ...entries.filter((e) => e.name !== c.name),
      ...items.map((it) => ({ id: newId(), name: c.name, room: s.room, ...it })),
    ]);
    setError(null);
  };
  const [name, setName] = useState(courseNames[0] ?? "");
  const [code, setCode] = useState("");
  const [room, setRoom] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseSlots(code), [code]);
  const clashes = useMemo(() => overlaps(entries), [entries]);
  const preview = parsed.items.map((it) => {
    const t = convert(it.day, it.from, it.to)!;
    return `${it.day} ${it.from}~${it.to}교시 → ${t.start}–${t.end}`;
  });

  const add = () => {
    if (!name.trim()) return setError("과목명을 적어주세요.");
    if (!parsed.items.length || parsed.errors.length)
      return setError(`교시 표기를 읽지 못했어요: ${parsed.errors.join(", ") || "예) 월2M~3M 수2M~3M"}`);
    onChange([
      ...entries,
      ...parsed.items.map((it) => ({ id: newId(), name: name.trim(), room: room.trim() || undefined, ...it })),
    ]);
    setCode("");
    setRoom("");
    setError(null);
  };

  const loadExample = () =>
    onChange([
      { id: newId(), name: "파이썬프로그래밍", day: "월", from: "2M", to: "3M", room: "상상관 501" },
      { id: newId(), name: "파이썬프로그래밍", day: "수", from: "2M", to: "3M", room: "상상관 501" },
      { id: newId(), name: "사고와표현", day: "화", from: "3", to: "4", room: "진리관 201" },
      { id: newId(), name: "선형대수", day: "목", from: "5M", to: "6M", room: "공학관 304" },
      { id: newId(), name: "영어 청취/회화", day: "금", from: "1", to: "2", room: "탐구관 105" },
    ]);

  return (
    <div className="tt">
      <header className="tt__head">
        <h2>{semesterLabel} 시간표</h2>
        <p>
          학교 시간표의 교시 표기를 그대로 적으면 실제 시각으로 바꿔 드려요. 월·수·목은 75분, 화·금은 50분 수업이라 같은 교시라도
          요일마다 시각이 달라요.
        </p>
        {onOpenCapture && (
          <button type="button" className="btn btn--ghost btn--sm tt__capture" onClick={(e) => onOpenCapture(e.currentTarget.getBoundingClientRect())}>
            📷 지난 학기 수강·성적 캡처로 넣기
          </button>
        )}
      </header>

      {withSections.length > 0 && (
        <section className="tt__sections">
          <h3>담은 과목 분반 고르기 · 2026-2 강의시간표 기준</h3>
          <ul>
            {withSections.map((c) => (
              <li key={c.id}>
                <b>{c.name}</b>
                <select
                  id={`tt-sec-${c.id}`}
                  aria-label={`${c.name} 분반`}
                  value={picked[c.id] ?? 0}
                  onChange={(e) => setPicked((p) => ({ ...p, [c.id]: Number(e.target.value) }))}
                >
                  {c.sections!.map((s, i) => (
                    <option key={s.sec + s.time} value={i}>
                      {s.sec}반 · {s.time} · {s.prof || "미정"} · {s.room}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn--sm btn--ghost" onClick={() => placeSection(c)}>
                  {placed(c.name) ? "다시 넣기" : "시간표에 넣기"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="tt__form">
        <label className="field">
          <span>과목명</span>
          <input id="tt-name" list="tt-courses" value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 파이썬프로그래밍" />
          <datalist id="tt-courses">
            {courseNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>교시 (시간표 표기 그대로)</span>
          <input
            id="tt-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="예) 월2M~3M 수2M~3M"
          />
        </label>
        <label className="field field--short">
          <span>강의실</span>
          <input id="tt-room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="선택" />
        </label>
        <button type="button" className="btn btn--primary" onClick={add}>
          추가
        </button>
      </div>
      {preview.length > 0 && !parsed.errors.length && <p className="tt__preview">{preview.join("   ·   ")}</p>}
      {error && <p className="field__error">{error}</p>}

      {clashes.size > 0 && (
        <p className="tt__warn">시간이 겹치는 과목이 있어요. 시간이 겹치는 과목은 학점으로 인정되지 않아요.</p>
      )}

      <div className="tt__scroll">
        <div className="tt__grid">
          <div className="tt__times">
            {HOURS.map((h) => (
              <span key={h} style={{ top: `${((h * 60 - START) / (END - START)) * 100}%` }}>
                {h}:00
              </span>
            ))}
          </div>
          {DAYS.map((d) => (
            <div key={d} className="tt__day">
              <b className="tt__dayname">
                {d}
                <small>{d === "화" || d === "금" ? "50분" : "75분"}</small>
              </b>
              <div className="tt__col">
                {HOURS.map((h) => (
                  <i key={h} style={{ top: `${((h * 60 - START) / (END - START)) * 100}%` }} />
                ))}
                {entries
                  .filter((e) => e.day === d)
                  .map((e) => {
                    const t = convert(e.day as Day, e.from, e.to);
                    if (!t) return null;
                    const top = ((toMin(t.start) - START) / (END - START)) * 100;
                    const h = ((toMin(t.end) - toMin(t.start)) / (END - START)) * 100;
                    return (
                      <div
                        key={e.id}
                        className={`tt__block ${clashes.has(e.id) ? "is-clash" : ""}`}
                        style={{ top: `${top}%`, height: `${h}%` }}
                        title={`${e.name} ${e.day}${e.from}~${e.to} ${t.start}–${t.end}`}
                      >
                        <b>{e.name}</b>
                        <span>
                          {t.start}–{t.end}
                        </span>
                        {e.room && <span>{e.room}</span>}
                        <button
                          type="button"
                          className="tt__del"
                          aria-label={`${e.name} ${e.day} 삭제`}
                          onClick={() => onChange(entries.filter((x) => x.id !== e.id))}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {entries.length === 0 && (
        <div className="tt__empty">
          <span>아직 입력한 수업이 없어요.</span>
          <button type="button" className="link-btn" onClick={loadExample}>
            예시 시간표 불러오기
          </button>
        </div>
      )}

      <details className="tt__ref">
        <summary>교시 환산표 보기</summary>
        <table>
          <thead>
            <tr>
              <th>교시</th>
              <th>월·수·목 (75분)</th>
              <th>화·금 (50분)</th>
            </tr>
          </thead>
          <tbody>
            {SLOT_CODES.filter((s) => !s.endsWith("M")).map((s) => {
              const mwt = convert("월", s, s);
              const tf = convert("화", s, s);
              return (
                <tr key={s}>
                  <th>
                    {s} · {s}M
                  </th>
                  <td>{mwt ? `${mwt.start}–${mwt.end}` : "—"}</td>
                  <td>{tf ? `${tf.start}–${tf.end}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p>월·수·목은 교시 1.5칸이 한 수업이에요. 예) 1·1M·2 → 09:00–10:15, 2M·3·3M → 10:30–11:45</p>
      </details>
    </div>
  );
}
