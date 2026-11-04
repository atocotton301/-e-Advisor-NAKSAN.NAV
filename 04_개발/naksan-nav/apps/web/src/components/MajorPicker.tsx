import { useMemo, useState } from "react";
import { COLLEGES } from "../data/majors";
import type { TrackRef } from "../types";

interface MajorPickerProps {
  title: string;
  subtitle: string;
  confirmLabel: string;
  initial?: TrackRef | null;
  /** 이미 고른 트랙은 다시 고를 수 없게 */
  excludeId?: string;
  onConfirm: (ref: TrackRef) => void;
  onSkip?: () => void;
  /** 이전 단계(로그인)로 돌아가기 */
  onBack?: () => void;
}

interface Section {
  key: string;
  title: string;
  college?: string;
  note?: string;
  items: TrackRef[];
}

function buildSections(collegeIdx: number, query: string): Section[] {
  const q = query.trim();
  const sections: Section[] = [];
  // 학과 하나가 곧 트랙인 단위는 한 묶음으로 모아 보여준다.
  const singles: TrackRef[] = [];

  for (const college of q ? COLLEGES : [COLLEGES[collegeIdx]!]) {
    for (const unit of college.units) {
      const items = unit.tracks
        .filter((t) => !q || t.name.includes(q) || unit.name.includes(q))
        .map((track) => ({ college: college.name, unit: unit.name, track }));
      if (items.length === 0) continue;
      if (unit.tracks.length === 1 && unit.tracks[0]!.name === unit.name) {
        singles.push(...items.map((ref) => ({ ...ref, track: { ...ref.track, note: ref.track.note ?? unit.note } })));
      } else {
        sections.push({ key: `${college.name}/${unit.name}`, title: unit.name, college: q ? college.name : undefined, note: unit.note, items });
      }
    }
  }
  if (singles.length > 0) sections.push({ key: "singles", title: "학과", items: singles });
  return sections;
}

export function MajorPicker({ title, subtitle, confirmLabel, initial, excludeId, onConfirm, onSkip, onBack }: MajorPickerProps) {
  const [collegeIdx, setCollegeIdx] = useState(() =>
    Math.max(0, COLLEGES.findIndex((c) => c.name === initial?.college)),
  );
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<TrackRef | null>(initial ?? null);

  const sections = useMemo(() => buildSections(collegeIdx, query), [collegeIdx, query]);
  const college = COLLEGES[collegeIdx]!;

  return (
    <div className="card picker">
      <header className="card__head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>

      <input
        className="search"
        placeholder="학과·트랙 이름으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {!query && (
        <div className="pill-row" role="tablist">
          {COLLEGES.map((c, i) => (
            <button
              key={c.name}
              type="button"
              role="tab"
              aria-selected={i === collegeIdx}
              className={`pill ${i === collegeIdx ? "is-active" : ""}`}
              onClick={() => setCollegeIdx(i)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      {!query && college.note && <p className="note">※ {college.note}</p>}

      <div className="unit-list">
        {sections.map((s) => (
          <section key={s.key} className="unit">
            <div className="unit__head">
              <strong>{s.title}</strong>
              {s.college && <span className="unit__college">{s.college}</span>}
              {s.note && <span className="unit__note">{s.note}</span>}
            </div>
            <div className="track-grid">
              {s.items.map((ref) => {
                const t = ref.track;
                const blocked = t.disabled || t.id === excludeId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`track ${picked?.track.id === t.id ? "is-picked" : ""}`}
                    disabled={blocked}
                    onClick={() => setPicked(ref)}
                  >
                    <span className="track__name">{t.name}</span>
                    <span className="track__meta">
                      {t.id === excludeId ? "제1트랙으로 선택됨" : t.disabled ? t.note : `${t.room} · ${t.phone}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {sections.length === 0 && <p className="empty">'{query}'에 맞는 학과·트랙이 없어요.</p>}
      </div>

      <footer className="card__foot">
        {picked ? (
          <p className="picked-summary">
            <b>{picked.track.name}</b>
            <span>
              {picked.college} · {picked.unit}
            </span>
            {picked.track.note && <em>{picked.track.note}</em>}
          </p>
        ) : (
          <p className="picked-summary picked-summary--empty">아직 선택하지 않았어요</p>
        )}
        <div className="card__actions">
          {onBack && (
            <button type="button" className="btn btn--ghost" onClick={onBack}>
              ← 학번 다시 입력
            </button>
          )}
          {onSkip && (
            <button type="button" className="btn btn--ghost" onClick={onSkip}>
              {initial ? "제2트랙 빼기" : "나중에"}
            </button>
          )}
          <button
            type="button"
            className="btn btn--primary"
            disabled={!picked}
            onClick={() => picked && onConfirm(picked)}
          >
            {confirmLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}
