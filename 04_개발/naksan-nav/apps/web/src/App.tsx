import { useCallback, useEffect, useState } from "react";
import { InterestPicker } from "./components/InterestPicker";
import { LoadingScreen } from "./components/LoadingScreen";
import { Login } from "./components/Login";
import { MajorPicker } from "./components/MajorPicker";
import { Roadmap } from "./components/Roadmap";
import { Scenery } from "./components/Scenery";
import { buildCatalog, loadCatalog } from "./data/curriculum";
import type { Catalog, Student, TrackRef } from "./types";

type Stage = "login" | "major" | "interest" | "loading" | "roadmap";

const STAGE_SWAP_MS = 320;

export function App() {
  const [stage, setStage] = useState<Stage>("login");
  const [leaving, setLeaving] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [track1, setTrack1] = useState<TrackRef | null>(null);
  const [track2, setTrack2] = useState<TrackRef | undefined>();
  const [interests, setInterests] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  const go = useCallback((next: Stage) => {
    setLeaving(true);
    setTimeout(() => {
      setStage(next);
      setLeaving(false);
    }, STAGE_SWAP_MS);
  }, []);

  useEffect(() => {
    if (stage !== "loading" || !track1) return;
    let alive = true;
    loadCatalog({ track1, track2 }).then((c) => {
      if (!alive) return;
      setCatalog(c);
      go("roadmap");
    });
    return () => {
      alive = false;
    };
  }, [stage, track1, track2, go]);

  const reset = () => {
    setTrack1(null);
    setTrack2(undefined);
    setInterests([]);
    setCatalog(null);
    go("login");
  };

  const changeTrack2 = (ref: TrackRef | undefined) => {
    if (!track1) return;
    setTrack2(ref);
    setCatalog(buildCatalog({ track1, track2: ref }));
  };

  const student: Student | null = track1
    ? { studentId, entryYear: 2000 + Number(studentId.slice(0, 2)), track1, track2, interests }
    : null;

  return (
    <div className={`app app--${stage}`}>
      <Scenery low={stage === "roadmap"} />

      {stage === "roadmap" && student && catalog ? (
        <Roadmap student={student} catalog={catalog} onReset={reset} onChangeTrack2={changeTrack2} />
      ) : (
        <main key={stage} className={`stage ${leaving ? "is-leaving" : ""}`}>
          {stage === "login" && (
            <Login
              onSubmit={(id) => {
                setStudentId(id);
                go("major");
              }}
            />
          )}
          {stage === "major" && (
            <MajorPicker
              title="입학한 학과·트랙을 골라주세요"
              subtitle={`${studentId.slice(0, 2)}학번 · 제1트랙(또는 학과)으로 로드맵을 시작해요.`}
              confirmLabel="다음"
              initial={track1}
              onConfirm={(ref) => {
                setTrack1(ref);
                go("interest");
              }}
            />
          )}
          {stage === "interest" && track1 && (
            <InterestPicker
              trackName={track1.track.name}
              initial={interests}
              onBack={() => go("major")}
              onConfirm={(tags) => {
                setInterests(tags);
                go("loading");
              }}
            />
          )}
          {stage === "loading" && track1 && <LoadingScreen trackName={track1.track.name} />}
        </main>
      )}
    </div>
  );
}
