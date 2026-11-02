import { useEffect, useState } from "react";
import { Boogi } from "./Boogi";

export function LoadingScreen({ trackName }: { trackName: string }) {
  const steps = [
    `${trackName} 교육과정을 불러오는 중`,
    "관심사 프로파일을 분석하는 중",
    "추천 과목 순위를 매기는 중",
    "졸업요건 점검표를 펼치는 중",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 650);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading__orb">
        <span className="loading__ring" />
        <span className="loading__ring loading__ring--late" />
        <span className="loading__word">상상력</span>
      </div>
      <p className="loading__title">
        상상력 넘치는 미래를 준비하는 중<span className="dots" />
      </p>
      <p key={step} className="loading__step">
        {steps[step]}
      </p>
      <div className="loading__runner">
        <Boogi running scale={3} />
      </div>
    </div>
  );
}
