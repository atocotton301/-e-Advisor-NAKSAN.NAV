import { useEffect, useState } from "react";
import { BOOGI } from "./Boogi";

// 홈 화면에 앱으로 설치하기 안내.
// 안드로이드·갤럭시탭·PC 크롬/엣지: 브라우저의 설치 창을 띄운다.
// 아이폰·아이패드 사파리: 설치 창이 없어서 「공유 → 홈 화면에 추가」를 안내한다.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const KEY = "naksan-nav:install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return window.localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) return;
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    if (isIos) setIos(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const close = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* 저장 못 해도 이번에는 닫힘 */
    }
  };

  if (hidden || (!evt && !ios)) return null;
  return (
    <div className="install" role="dialog" aria-label="앱으로 설치">
      <img src={BOOGI.wave} alt="" />
      {evt ? (
        <>
          <p>
            <b>NAKSAN.NAV를 앱으로 설치</b>홈 화면에서 바로 열 수 있어요.
          </p>
          <button
            type="button"
            className="install__go"
            onClick={async () => {
              await evt.prompt();
              await evt.userChoice;
              setEvt(null);
              close();
            }}
          >
            설치
          </button>
        </>
      ) : (
        <p>
          <b>아이폰·아이패드에 앱으로 설치</b>사파리 아래쪽 공유 버튼 → 「홈 화면에 추가」를 누르세요.
        </p>
      )}
      <button type="button" className="install__x" aria-label="닫기" onClick={close}>
        ✕
      </button>
    </div>
  );
}
