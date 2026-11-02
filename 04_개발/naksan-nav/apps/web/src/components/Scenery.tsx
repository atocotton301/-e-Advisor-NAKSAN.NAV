/** 하늘·구름·낙산 언덕 배경 */
export function Scenery({ low = false }: { low?: boolean }) {
  return (
    <div className={`scenery ${low ? "scenery--low" : ""}`} aria-hidden>
      <div className="cloud cloud--a" />
      <div className="cloud cloud--b" />
      <div className="cloud cloud--c" />
      <svg className="hills" viewBox="0 0 1440 260" preserveAspectRatio="none">
        <path
          className="hill hill--far"
          d="M0 150 C 180 90 320 100 470 135 C 640 175 760 80 940 95 C 1110 110 1240 160 1440 120 L1440 260 L0 260 Z"
        />
        <path
          className="hill hill--mid"
          d="M0 190 C 160 150 300 140 460 170 C 610 198 720 150 880 145 C 1060 140 1200 195 1440 165 L1440 260 L0 260 Z"
        />
        <path
          className="hill hill--near"
          d="M0 225 C 220 195 380 205 560 220 C 760 236 900 196 1100 205 C 1250 212 1350 230 1440 222 L1440 260 L0 260 Z"
        />
      </svg>
    </div>
  );
}
