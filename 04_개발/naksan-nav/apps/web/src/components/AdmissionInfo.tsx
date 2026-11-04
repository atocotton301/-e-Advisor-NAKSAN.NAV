import { ORG_UNITS } from "../data/organization";
import { OFFICIAL_LINKS } from "../data/hansung";
import type { AdmissionKind } from "../types";
import { Boogi } from "./Boogi";

const COPY: Record<string, { title: string; lead: string; plan: string[]; match: RegExp }> = {
  대학원: {
    title: "대학원생 로드맵",
    lead: "대학원은 과정(석사·박사)과 대학원마다 수료학점·논문 심사·외국어 시험 기준이 달라서, 학부와 다른 로드맵이 필요해요.",
    plan: ["학기별 수강 + 수료학점 체크", "논문 지도교수 선정 → 계획서 → 예비심사 → 본심사 일정 관리", "외국어·종합시험 응시 시기 알림", "학위수여 예정 시기 계산"],
    match: /대학원/,
  },
  평생교육: {
    title: "평생교육 과정 로드맵",
    lead: "평생교육 과정은 학점은행·비학위 과정 등 운영 방식이 달라서, 과정별 이수 기준을 받아 따로 설계할 예정이에요.",
    plan: ["수강 과정·이수 시간 기록", "학점은행 학점 인정 현황", "수료증 발급 시기 안내"],
    match: /평생교육/,
  },
};

export function AdmissionInfo({ kind, onBack }: { kind: AdmissionKind; onBack: () => void }) {
  const c = COPY[kind] ?? COPY.대학원!;
  const contacts = ORG_UNITS.filter((o) => c.match.test(o.name));
  return (
    <div className="card adm">
      <div className="adm__head">
        <Boogi pose="front" variant="frontShell" scale={2.6} />
        <div>
          <h1>{c.title}</h1>
          <p>{c.lead}</p>
        </div>
      </div>
      <section>
        <h3>준비 중인 기능</h3>
        <ul className="adm__plan">
          {c.plan.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>지금 문의할 곳</h3>
        <ul className="adm__contacts">
          {contacts.map((o) => (
            <li key={o.name}>
              <b>{o.name}</b>
              <span>{o.room && `📍 ${o.room}`}</span>
              <a href={`tel:${o.phone.replace(/[^\d]/g, "").slice(0, 11)}`}>{o.phone}</a>
            </li>
          ))}
        </ul>
        <a className="tg__link" href={OFFICIAL_LINKS.organization} target="_blank" rel="noreferrer">
          기구표 및 부서안내 ↗
        </a>
      </section>
      <button type="button" className="btn btn--ghost btn--block" onClick={onBack}>
        ← 다른 유형으로 시작하기
      </button>
    </div>
  );
}
