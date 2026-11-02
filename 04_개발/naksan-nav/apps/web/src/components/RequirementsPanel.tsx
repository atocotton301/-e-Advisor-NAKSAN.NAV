import type { MouseEvent } from "react";
import { isMet, REQ, type Progress, type RequirementStatus, type TrackProgress } from "../lib/requirements";

interface RequirementsPanelProps {
  status: RequirementStatus;
  version: string;
  track1: string;
  track2?: string;
  onPickTrack2: (origin: DOMRect) => void;
}

/** 값이 바뀔 때마다 key 로 다시 그려 통 튀는 애니메이션을 준다. */
function Num({ p, unit = "" }: { p: Progress; unit?: string }) {
  return (
    <span className={`num ${isMet(p) ? "is-met" : p.have > 0 ? "is-partial" : ""}`}>
      <b key={p.have}>{p.have}</b>/{p.need}
      {unit}
    </span>
  );
}

function Bar({ p }: { p: Progress }) {
  return (
    <span className="bar">
      <span className={`bar__fill ${isMet(p) ? "is-met" : ""}`} style={{ width: `${Math.min(p.have / p.need, 1) * 100}%` }} />
    </span>
  );
}

function TrackRow({ name, t }: { name: string; t: TrackProgress }) {
  return (
    <tr>
      <th title={name}>{name}</th>
      <td>
        <Num p={t.basic} />
      </td>
      <td>
        <Num p={t.required} />
      </td>
      <td>
        <Num p={t.total} />
      </td>
    </tr>
  );
}

export function RequirementsPanel({ status, version, track1, track2, onPickTrack2 }: RequirementsPanelProps) {
  const pickTrack2 = (e: MouseEvent<HTMLButtonElement>) => onPickTrack2(e.currentTarget.getBoundingClientRect());

  return (
    <aside className="reqs" aria-label="졸업요건">
      <header className="reqs__head">
        <h2>졸업요건</h2>
        <span className="chip chip--blue">{version} 기준</span>
      </header>

      <div className="reqs__big">
        <div className="big-stat">
          <span>졸업학점</span>
          <Num p={status.totalCredits} />
          <Bar p={status.totalCredits} />
        </div>
        <div className="big-stat">
          <span>비교과 포인트</span>
          <Num p={status.extraPoints} unit="pt" />
          <Bar p={status.extraPoints} />
        </div>
      </div>

      <section className="reqs__sec">
        <h3>
          교양 · 필수교양(기초) <Num p={status.liberalBasicTotal} />
        </h3>
        <ul className="req-list">
          {status.liberalBasic.map((r) => (
            <li key={r.label}>
              <span>{r.label}</span>
              <Num p={r} />
            </li>
          ))}
        </ul>
      </section>

      <section className="reqs__sec">
        <h3>
          교양 · 선택필수교양 <Num p={status.areaCount} unit="분야" />
        </h3>
        <div className="areas">
          {status.areas.map((a) => (
            <span key={a.name} className={`area ${a.credits > 0 ? "is-on" : ""}`}>
              {a.name}
              <b>{a.credits}</b>
            </span>
          ))}
        </div>
        <p className="reqs__line">
          이수 학점 <Num p={status.areaCredits} /> <small>({REQ.liberalAreaCredits.min}~{REQ.liberalAreaCredits.max}학점)</small>
        </p>
      </section>

      <section className="reqs__sec">
        <h3>
          전공 · 총합계 <Num p={status.majorTotal} />
        </h3>
        <table className="track-table">
          <thead>
            <tr>
              <th />
              <th>전공기초</th>
              <th>전공지정</th>
              <th>전공소계</th>
            </tr>
          </thead>
          <tbody>
            <TrackRow name={`1 · ${track1}`} t={status.track1} />
            {status.track2 && track2 ? (
              <TrackRow name={`2 · ${track2}`} t={status.track2} />
            ) : (
              <tr>
                <th>2 · 미선택</th>
                <td colSpan={3}>
                  <button type="button" className="link-btn" onClick={pickTrack2}>
                    + 제2트랙 고르기
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {track2 && (
          <button type="button" className="link-btn link-btn--sm" onClick={pickTrack2}>
            제2트랙 바꾸기
          </button>
        )}
      </section>

      <p className="reqs__note">
        * 참고용 시뮬레이션이에요. 졸업 학기에는 종합정보시스템 졸업(가)사정 결과로 꼭 확인하세요.
      </p>
    </aside>
  );
}
