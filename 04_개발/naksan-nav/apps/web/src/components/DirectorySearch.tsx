import { useMemo, useState } from "react";
import { DIRECTORY, type Contact } from "../data/directory";
import { OFFICIAL_LINKS } from "../data/hansung";

const KINDS: (Contact["kind"] | "전체")[] = ["전체", "트랙·학과", "교수 연구실", "교학팀", "행정·지원", "대학원", "대표"];
const norm = (s: string) => s.replace(/[\s·&/]/g, "").toLowerCase();

export function DirectorySearch({ initial = "" }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const [kind, setKind] = useState<(typeof KINDS)[number]>("전체");
  const [copied, setCopied] = useState<string | null>(null);

  const hits = useMemo(() => {
    const k = norm(q);
    return DIRECTORY.filter(
      (c) =>
        (kind === "전체" || c.kind === kind) &&
        (!k || norm(c.name).includes(k) || norm(c.unit).includes(k) || norm(c.note ?? "").includes(k) || norm(c.room ?? "").includes(k) || c.phone.replace(/\D/g, "").includes(k)),
    );
  }, [q, kind]);

  const copy = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(phone);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="dir">
      <header className="tt__head">
        <h2>한성대 전화번호 · 교수 연구실 찾기</h2>
        <p>트랙·학과 사무실, 교수 연구실, 교학팀, 행정 부서, 대학원의 전화번호와 위치(건물·호실)를 이름·전공·번호·건물명으로 찾아요.</p>
      </header>
      <input
        id="dir-q"
        className="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="예) 서상민, 학사운영팀, 상상관, 우촌관 301, 4376"
        autoFocus
      />
      <div className="dir__kinds">
        {KINDS.map((k) => (
          <button key={k} type="button" className={`chip ${kind === k ? "chip--blue" : ""}`} onClick={() => setKind(k)}>
            {k}
          </button>
        ))}
      </div>
      <ul className="dir__list">
        {hits.map((c) => (
          <li key={`${c.kind}|${c.name}|${c.unit}|${c.phone}`}>
            <div>
              <b>{c.name}</b>
              <span>
                {c.unit}
                {c.note ? ` · ${c.note}` : ""}
              </span>
              {c.room ? <span className="dir__room">📍 {c.room}</span> : c.kind === "교수 연구실" ? <span className="dir__room dir__room--na">연구실 호수 확인 중</span> : null}
            </div>
            <button type="button" className="dir__phone" onClick={() => copy(c.phone)} title="눌러서 번호 복사">
              {copied === c.phone ? "복사됨" : c.phone}
            </button>
          </li>
        ))}
        {!hits.length && <li className="dir__empty">찾는 번호가 없어요. 학교 홈페이지 문의처에서 확인해 보세요.</li>}
      </ul>
      <p className="reqs__note">
        출처: 한성대 홈페이지{" "}
        <a href={OFFICIAL_LINKS.contacts} target="_blank" rel="noreferrer">
          문의처
        </a>
        , 기구표 및 부서안내(부서 위치), 학과 안내(학과 사무실), 각 단과대 교수소개(257명), 트랙별 내선번호(2026.1.1. 기준). 교수 연구실 호수는 팀이 정리한 교수연구실 안내(228명) 기준이에요.
      </p>
    </div>
  );
}
