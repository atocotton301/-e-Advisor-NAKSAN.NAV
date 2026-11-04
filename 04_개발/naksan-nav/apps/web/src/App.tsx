import { useCallback, useEffect, useState } from "react";
import { InterestPicker } from "./components/InterestPicker";
import { LoadingScreen } from "./components/LoadingScreen";
import { Login } from "./components/Login";
import { MajorPicker } from "./components/MajorPicker";
import { Roadmap } from "./components/Roadmap";
import { Scenery } from "./components/Scenery";
import { buildCatalog, loadCatalog } from "./data/curriculum";
import { applyRequirementVersion, entryYearOf } from "./lib/requirements";
import type { Admission, Catalog, Student, TrackRef } from "./types";
import { AdmissionInfo } from "./components/AdmissionInfo";
import { COLLEGES } from "./data/majors";

type Stage = "login" | "major" | "interest" | "loading" | "roadmap" | "info";

const STAGE_SWAP_MS = 320;

export function App() {
  const [stage, setStage] = useState<Stage>("login");
  const [leaving, setLeaving] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [admission, setAdmission] = useState<Admission>({ kind: "신입학" });
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
    loadCatalog({ track1, track2, entryYear: entryYearOf(studentId) }).then((c) => {
      if (!alive) return;
      setCatalog(c);
      go("roadmap");
    });
    return () => {
      alive = false;
    };
  }, [stage, track1, track2, studentId, go]);

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
    setCatalog(buildCatalog({ track1, track2: ref, entryYear: entryYearOf(studentId) }));
  };

  const student: Student | null = track1
    ? { studentId, entryYear: entryYearOf(studentId), track1, track2, interests, admission }
    : null;

  return (
    <div className={`app app--${stage}`}>
      <Scenery low={stage === "roadmap"} />

      {stage === "roadmap" && student && catalog ? (
        <Roadmap student={student} catalog={catalog} onReset={reset} onChangeTrack2={changeTrack2} />
      ) : (
        <main key={stage} className={`stage ${leaving ? "is-leaving" : ""}`}>
          {stage === "info" && <AdmissionInfo kind={admission.kind} onBack={() => go("login")} />}
          {stage === "login" && (
            <Login
              initialId={studentId}
              initialAdmission={admission}
              onSubmit={(id, adm) => {
                setStudentId(id);
                setAdmission(adm);
                applyRequirementVersion(entryYearOf(id), adm);
                go(adm.kind === "대학원" || adm.kind === "평생교육" ? "info" : "major");
              }}
            />
          )}
          {stage === "major" && (
            <MajorPicker
              title="입학한 학과·트랙을 골라주세요"
              subtitle={`${studentId.slice(0, 2)}학번 · 제1트랙(또는 학과)으로 로드맵을 시작해요.`}
              confirmLabel="다음"
              initial={
                track1 ??
                (admission.kind === "미래플러스"
                  ? (() => {
                      const c = COLLEGES.find((x) => x.name === "미래플러스대학");
                      const u = c?.units[0];
                      return c && u ? { college: c.name, unit: u.name, track: u.tracks[0]! } : null;
                    })()
                  : null)
              }
              onBack={() => go("login")}
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
