import { useMemo, useState } from "react";
import { EXAM_LINKS, EXTERNAL_TYPES, OPPORTUNITIES } from "../data/external";

export interface ExternalEntry {
  id: string;
  kind: string;
  name: string;
  points: number;
}

type Tab = "external" | "exam" | "radar";

interface ActivityGuideProps {
  semesterLabel: string;
  interests: string[];
  entries: ExternalEntry[];
  onAdd: (entry: ExternalEntry) => void;
  onRemove: (id: string) => void;
  /** 비교과 이수 내역 캡처 입력 열기 */
  onOpenCapture?: (origin: DOMRect) => void;
}

let seq = 0;

export function ActivityGuide({ semesterLabel, interests, entries, onAdd, onRemove, onOpenCapture }: ActivityGuideProps) {
  const [tab, setTab] = useState<Tab>("external");
  const [typeIdx, setTypeIdx] = useState(0);
  const [optIdx, setOptIdx] = useState(0);
  const [count, setCount] = useState(1);

  const type = EXTERNAL_TYPES[typeIdx]!;
  const opt = type.options[Math.min(optIdx, type.options.length - 1)]!;
  const raw = opt.points * (type.unit ? Math.max(count, 1) : 1);
  const usedInType = entries.filter((e) => e.kind === type.kind).reduce((acc, e) => acc + e.points, 0);
  const capped = type.cap ? Math.max(Math.min(raw, type.cap - usedInType), 0) : raw;

  const radar = useMemo(
    () =>
      OPPORTUNITIES.map((o) => ({ o, hit: o.tags.filter((t) => interests.includes(t)) })).sort(
        (a, b) => b.hit.length - a.hit.length || a.o.deadline.localeCompare(b.o.deadline),
      ),
    [interests],
  );

  return (
    <div className="guide">
      <header className="tt__head">
        <h2>비교과 · 자격증 가이드</h2>
        <p>교외 활동 포인트 계산, 어학·자격증 접수, 내 관심사에 맞는 공모전·대외활동을 한곳에서 봐요.</p>
        {onOpenCapture && (
          <button type="button" className="btn btn--ghost btn--sm tt__capture" onClick={(e) => onOpenCapture(e.currentTarget.getBoundingClientRect())}>
            📷 비교과 이수 내역 캡처로 넣기
          </button>
        )}
      </header>

      <div className="course-panel__tabs" role="tablist">
        {(
          [
            ["external", "교외비교과 계산"],
            ["exam", "어학·자격증"],
            ["radar", "공모전·대외활동"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`tab ${tab === id ? "is-active" : ""}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "external" && (
        <section className="guide__sec">
          <div className="guide__form">
            <label className="field">
              <span>활동 유형</span>
              <select
                id="guide-type"
                value={typeIdx}
                onChange={(e) => {
                  setTypeIdx(Number(e.target.value));
                  setOptIdx(0);
                  setCount(1);
                }}
              >
                {EXTERNAL_TYPES.map((t, i) => (
                  <option key={t.kind} value={i}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>세부 항목</span>
              <select id="guide-opt" value={optIdx} onChange={(e) => setOptIdx(Number(e.target.value))}>
                {type.options.map((o, i) => (
                  <option key={o.label} value={i}>
                    {o.label} · {o.points}pt
                  </option>
                ))}
              </select>
            </label>
            {type.unit && (
              <label className="field field--short">
                <span>{type.unit}</span>
                <input id="guide-count" type="number" min={1} max={99} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} />
              </label>
            )}
          </div>

          <div className="guide__result">
            <div>
              <span>예상 포인트</span>
              <b>{capped}pt</b>
              {type.cap && <small>이 유형은 학기 최대 {type.cap}pt · 이번 학기 {usedInType}pt 사용</small>}
            </div>
            <button
              type="button"
              className="btn btn--primary"
              disabled={capped <= 0}
              onClick={() => onAdd({ id: `ext-${Date.now()}-${seq++}`, kind: type.kind, name: `${type.name} · ${opt.label}${type.unit ? ` ×${count}` : ""}`, points: capped })}
            >
              {semesterLabel} 학기에 추가
            </button>
          </div>
          <p className="guide__proof">
            <b>필요 증빙</b> {type.proof}
            {type.note && <span>{type.note}</span>}
          </p>

          {entries.length > 0 && (
            <ul className="guide__list">
              {entries.map((e) => (
                <li key={e.id}>
                  <span>{e.name}</span>
                  <b>{e.points}pt</b>
                  <button type="button" className="link-btn link-btn--sm" onClick={() => onRemove(e.id)}>
                    빼기
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="reqs__note">신청: 스마트자기관리시스템 ▶ 교외비교과활동. 배점표(2025.12.2.) 기준 예상치이며 실제 인정은 심사 후 확정돼요.</p>
        </section>
      )}

      {tab === "exam" && (
        <section className="guide__sec">
          <div className="ts__table">
            <table>
              <thead>
                <tr>
                  <th>시험·자격</th>
                  <th>비교과 (최고 등급)</th>
                  <th>접수</th>
                </tr>
              </thead>
              <tbody>
                {EXAM_LINKS.map((x) => (
                  <tr key={x.exam}>
                    <td>{x.exam}</td>
                    <td>{x.best}</td>
                    <td>
                      <a href={x.url} target="_blank" rel="noreferrer">
                        접수 사이트
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="reqs__note">
            영어 교양필수 면제 기준(TOEIC 850 이상 등)과 학과별 어학 졸업요건은 학과·트랙별로 조사해 반영할 예정이에요.
          </p>
        </section>
      )}

      {tab === "radar" && (
        <section className="guide__sec">
          <ul className="radar">
            {radar.map(({ o, hit }) => (
              <li key={o.id} className={hit.length ? "is-hit" : ""}>
                <div>
                  <b>{o.name}</b>
                  <span>
                    {o.scope} {o.kind} · 마감 {o.deadline.slice(5).replace("-", "/")} · {o.points}
                  </span>
                </div>
                <span className="matched">{(hit.length ? hit : o.tags).map((t) => `#${t}`).join(" ")}</span>
              </li>
            ))}
          </ul>
          <p className="reqs__note">예시 데이터예요. 실제 버전은 교내 공지와 외부 공모전 공고를 모아 관심사·트랙 순으로 보여주고 마감 알림을 보내요.</p>
        </section>
      )}
    </div>
  );
}
