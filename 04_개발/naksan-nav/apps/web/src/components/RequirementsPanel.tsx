import { gradMet, RULE_LABEL, TRACK_GRAD } from "../data/trackGrad";
import { AREA_KEY } from "../lib/areas";
import type { MouseEvent } from "react";
import { EXTRA_RULE, type ExtraRow } from "../lib/extracurricular";
import { isMet, REQ, type Progress, type RequirementStatus, type TrackProgress } from "../lib/requirements";

interface RequirementsPanelProps {
  status: RequirementStatus;
  version: string;
  track1: string;
  track2?: string;
  semesterLabel: string;
  extra: ExtraRow;
  onPickTrack2: (origin: DOMRect) => void;
  /** 트랙(학과) 졸업요건 체크 상태 */
  gradChecks: Record<string, boolean[]>;
  onToggleGrad: (track: string, i: number) => void;
}

function TrackGradBox({ name, checks, onToggle }: { name: string; checks: boolean[]; onToggle: (i: number) => void }) {
  const g = TRACK_GRAD[name];
  if (!g) {
    return (
      <div className="tg">
        <div className="tg__head">
          <b>{name}</b>
          <span className="tg__rule">조사 중</span>
        </div>
        <p className="tg__note">학과 졸업요건을 아직 모으지 못했어요. 학과 사무실에 확인해 주세요.</p>
      </div>
    );
  }
  const met = gradMet(g, checks);
  return (
    <div className={`tg ${met ? "is-met" : ""}`}>
      <div className="tg__head">
        <b>{name}</b>
        <span className="tg__rule">{RULE_LABEL(g)}</span>
        {met !== null && <span className={`tg__state ${met ? "ok" : ""}`}>{met ? "충족" : "미충족"}</span>}
      </div>
      <ul>
        {g.items.map((it, i) => (
          <li key={it}>
            {g.rule === "info" ? (
              <span className="tg__info">· {it}</span>
            ) : (
              <label>
                <input type="checkbox" checked={!!checks[i]} onChange={() => onToggle(i)} />
                <span>{it}</span>
              </label>
            )}
          </li>
        ))}
      </ul>
      {g.note && <p className="tg__note">{g.note}</p>}
      <a className="tg__link" href={g.url} target="_blank" rel="noreferrer">
        학과 원문 보기 ↗
      </a>
    </div>
  );
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

export function RequirementsPanel({ status, version, track1, track2, semesterLabel, extra, onPickTrack2, gradChecks, onToggleGrad }: RequirementsPanelProps) {
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
          {REQ.extraPoints > 0 ? (
            <>
              <Num p={status.extraPoints} unit="pt" />
              <Bar p={status.extraPoints} />
            </>
          ) : (
            <span className="num">해당 없음</span>
          )}
        </div>
      </div>

      <section className="reqs__sec reqs__extra">
        <h3>
          {semesterLabel} 비교과 인정 <span className="num"><b>{extra.recognized}</b>/{EXTRA_RULE.perSemester}pt</span>
        </h3>
        <dl className="extra-row">
          <div>
            <dt>획득</dt>
            <dd>{extra.earned}pt</dd>
          </div>
          <div>
            <dt>이월받음</dt>
            <dd>{extra.carryIn}pt</dd>
          </div>
          <div>
            <dt>이월</dt>
            <dd className={extra.carryOut ? "is-carry" : ""}>{extra.carryOut}pt</dd>
          </div>
          <div>
            <dt>소멸</dt>
            <dd className={extra.lost ? "is-lost" : ""}>{extra.lost}pt</dd>
          </div>
        </dl>
        <p className="reqs__rule">
          한 학기 {EXTRA_RULE.perSemester}pt까지 인정 · {EXTRA_RULE.perSemester + 1}~{EXTRA_RULE.carryLimit}pt는 차액을 다음 학기로 이월 ·{" "}
          {EXTRA_RULE.carryLimit}pt 초과분은 소멸
        </p>
      </section>

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
            <span key={a.name} className={`area ${a.credits > 0 ? `is-on achip--${AREA_KEY[a.name] ?? "etc"}` : ""}`}>
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

      <section className="reqs__sec">
        <h3>트랙(학과) 졸업요건</h3>
        <p className="tg__lead">학점 외에 학과가 따로 정한 졸업 인증이에요. 채운 항목에 체크해 두세요.</p>
        {[track1, ...(track2 ? [track2] : [])].map((t) => (
          <TrackGradBox key={t} name={t} checks={gradChecks[t] ?? []} onToggle={(i) => onToggleGrad(t, i)} />
        ))}
      </section>

      {REQ.note && <p className="reqs__warn">{REQ.note}</p>}
      <p className="reqs__note">
        * 참고용 시뮬레이션이에요. 졸업 학기에는 종합정보시스템 졸업(가)사정 결과로 꼭 확인하세요.
      </p>
    </aside>
  );
}
