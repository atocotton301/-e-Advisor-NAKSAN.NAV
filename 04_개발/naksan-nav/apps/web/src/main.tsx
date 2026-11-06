import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 앱 설치·오프라인용 서비스 워커 (https로 배포된 사이트에서만)
if ("serviceWorker" in navigator && location.protocol === "https:" && location.hostname.endsWith("github.io")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  });
}
