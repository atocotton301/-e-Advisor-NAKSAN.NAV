import { useState } from "react";

export interface VersionSummary {
  credits: number;
  majorCredits: number;
  points: number;
  track2?: string;
  reached: number;
}

export interface SavedVersion<T> {
  id: string;
  name: string;
  savedAt: string;
  summary: VersionSummary;
  data: T;
}

const SEM = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

interface Props<T> {
  versions: SavedVersion<T>[];
  activeId: string | null;
  current: VersionSummary;
  onSaveNew: (name: string) => void;
  onOverwrite: (id: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function RoadmapVersions<T>({ versions, activeId, current, onSaveNew, onOverwrite, onLoad, onDelete, onRename }: Props<T>) {
  const [name, setName] = useState(`로드맵 ${versions.length + 1}`);
  const rows = [{ id: "__now", name: "지금 화면", summary: current, savedAt: "" }, ...versions];
  const best = Math.max(...rows.map((r) => r.summary.credits));

  return (
    <div className="ver">
      <header className="tt__head">
        <h2>로드맵 버전</h2>
        <p>지금 설계를 버전으로 저장해 두고, 트랙·과목을 바꿔 본 다른 안과 비교할 수 있어요. 저장은 이 브라우저에만 남아요.</p>
      </header>

      <div className="ver__save">
        <input aria-label="버전 이름" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => {
            onSaveNew(name.trim() || `로드맵 ${versions.length + 1}`);
            setName(`로드맵 ${versions.length + 2}`);
          }}
        >
          새 버전으로 저장
        </button>
      </div>

      <table className="ver__table">
        <thead>
          <tr>
            <th>버전</th>
            <th>진행</th>
            <th>총 학점</th>
            <th>전공</th>
            <th>비교과</th>
            <th>제2트랙</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} className={v.id === "__now" ? "is-now" : v.id === activeId ? "is-active" : ""}>
              <th>
                {v.id === "__now" ? (
                  <b>지금 화면</b>
                ) : (
                  <input className="ver__name" aria-label="버전 이름 바꾸기" value={v.name} onChange={(e) => onRename(v.id, e.target.value)} />
                )}
                {v.savedAt && <small>{v.savedAt}</small>}
              </th>
              <td>{SEM[v.summary.reached]}까지</td>
              <td className={v.summary.credits === best ? "is-best" : ""}>{v.summary.credits}</td>
              <td>{v.summary.majorCredits}</td>
              <td>{v.summary.points}pt</td>
              <td>{v.summary.track2 ?? "—"}</td>
              <td className="ver__acts">
                {v.id !== "__now" && (
                  <>
                    <button type="button" className="link-btn" onClick={() => onLoad(v.id)}>
                      불러오기
                    </button>
                    <button type="button" className="link-btn" onClick={() => onOverwrite(v.id)}>
                      덮어쓰기
                    </button>
                    <button type="button" className="link-btn link-btn--danger" onClick={() => onDelete(v.id)}>
                      삭제
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!versions.length && <p className="grad__hint">아직 저장한 버전이 없어요. 위에서 이름을 정하고 저장해 보세요.</p>}
    </div>
  );
}
