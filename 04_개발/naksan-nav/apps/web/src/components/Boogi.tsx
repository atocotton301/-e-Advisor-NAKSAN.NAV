import { useEffect, useState } from "react";
import type { Mood } from "../types";

// 한성대 공식 캐릭터 '상상부기' 픽셀아트.
// 남색 후드 속 하얀 얼굴, 하늘색 볼, HSU 후드티, 등 뒤 하늘색 등껍질.

type Px = "D" | "N" | "W" | "C" | "S" | "s" | "E" | "w" | "B";

const COLORS: Record<Px, string> = {
  D: "#0e2255", // 외곽선
  N: "#1c3c96", // 후드·후드티 남색
  W: "#ffffff", // 얼굴
  C: "#a3c2f0", // 볼
  S: "#b8cff3", // 등껍질
  s: "#6d93d4", // 등껍질 무늬
  E: "#14244f", // 눈·입
  w: "#e8eefc", // 후드티 로고
  B: "#7fc3ff", // 땀방울
};

type Grid = (Px | null)[][];
type Dot = [x: number, y: number, px: Px];

const toGrid = (rows: string[]): Grid => rows.map((r) => [...r].map((ch) => (ch === "." ? null : (ch as Px))));

function paint(base: Grid, dots: Dot[]): Grid {
  const g = base.map((row) => [...row]);
  for (const [x, y, px] of dots) {
    const row = g[y];
    if (row && x >= 0 && x < row.length) row[x] = px;
  }
  return g;
}

/** 좌우 대칭인 정면 그림은 왼쪽 절반만 그리고 뒤집어 붙인다. */
const mirror = (halves: string[]) => halves.map((h) => h + [...h].reverse().join(""));

// ───────── 정면 (22×24) ─────────
const FRONT = toGrid(
  mirror([
    "......DDDDD",
    "....DDNNNNN",
    "...DNNNNNNN",
    "..DNNNNWWWW",
    "..DNNWWWWWW",
    ".DNNWWWWWWW",
    ".DNWWWWWWWW",
    ".DNWWWWWWWW",
    ".DNWWWWWWWW",
    ".DNWCCWWWWW",
    ".DNWCCWWWWW",
    ".DNWWWWWWWW",
    ".DNNWWWWWWW",
    "..DNNWWWWWW",
    "...DNNWWWWW",
    "....DNNNNNN",
    "..DSDNNNNNN",
    ".DSSDNNNNNN",
    ".DSDNDNNNwN",
    ".DSDNDNNNNw",
    "..DSDNNNNwN",
    "...DDNNNNNN",
    ".....DNNND.",
    ".....DDDDD.",
  ]),
);

const FRONT_FACE: Record<Mood, Dot[]> = {
  // ^ ^ 눈 + ω 입
  happy: [
    [6, 7, "E"], [5, 8, "E"], [7, 8, "E"],
    [15, 7, "E"], [14, 8, "E"], [16, 8, "E"],
    [8, 10, "E"], [10, 10, "E"], [11, 10, "E"], [13, 10, "E"], [9, 11, "E"], [12, 11, "E"],
  ],
  normal: [
    [6, 7, "E"], [6, 8, "E"], [15, 7, "E"], [15, 8, "E"],
    [9, 10, "E"], [12, 10, "E"], [10, 11, "E"], [11, 11, "E"],
  ],
  sad: [
    [6, 7, "E"], [6, 8, "E"], [15, 7, "E"], [15, 8, "E"],
    [10, 10, "E"], [11, 10, "E"], [9, 11, "E"], [12, 11, "E"],
    [18, 4, "B"], [18, 5, "B"],
  ],
};

// ───────── 옆모습 (24×25, 오른쪽을 보고 달림) ─────────
const SIDE = toGrid([
  "..........DDDDDD........",
  "........DDNNNNNNDD......",
  ".......DNNNNNNNNNNDD....",
  "......DNNNNNNNNNNNNND...",
  "......DNNNNNNNNNWWWWND..",
  ".....DNNNNNNNNWWWWWWND..",
  ".....DNNNNNNNWWWWWWWWND.",
  ".....DNNNNNNWWWWWWWWWWD.",
  ".....DNNNNNWWWWWWWWWWWD.",
  ".....DNNNNNWWWWWWWWWWWD.",
  ".....DNNNNNWWWWCCWWWWWD.",
  ".....DNNNNNWWWWCCWWWWWD.",
  "......DNNNNNWWWWWWWWWD..",
  "......DNNNNNNWWWWWWWDD..",
  ".......DDNNNNNNWWWWDD...",
  "...DDDDDDNNNNNNNDDD.....",
  "..DSSsSSDNNNNNNNND......",
  ".DSsSSsSDNNNNwNNND......",
  ".DSSsSSsDNNNNNNNND......",
  ".DSsSSsSDNNNNNNNND......",
  ".DSSsSSsDNNNNNNNND......",
  "..DSSsSSDNNNNNNNND......",
  "........................",
  "........................",
  "........................",
]);

// 다리·팔: 0번은 모은 자세, 1번은 보폭을 벌린 자세
const SIDE_LIMBS: [Dot[], Dot[]] = [
  [
    ...rowDots(22, "...DDDDDDNNDDDNND......."),
    ...rowDots(23, "........DNND.DNND......."),
    ...rowDots(24, "........DDDD.DDDD......."),
    [17, 17, "D"], [18, 17, "D"], [16, 18, "N"], [17, 18, "N"], [18, 18, "N"], [19, 18, "D"], [17, 19, "D"], [18, 19, "D"],
  ],
  [
    ...rowDots(22, "...DDDDDNNDDDDDNND......"),
    ...rowDots(23, ".......DNND...DNND......"),
    ...rowDots(24, ".......DDDD...DDDD......"),
    [17, 18, "D"], [16, 19, "N"], [17, 19, "N"], [18, 19, "D"], [17, 20, "D"],
  ],
];

function rowDots(y: number, row: string): Dot[] {
  return [...row].flatMap((ch, x) => (ch === "." ? [] : [[x, y, ch as Px] as Dot]));
}

const SIDE_FACE: Record<Mood, Dot[]> = {
  happy: [[17, 7, "E"], [16, 8, "E"], [18, 8, "E"], [17, 11, "E"], [18, 12, "E"], [19, 11, "E"]],
  normal: [[17, 7, "E"], [17, 8, "E"], [17, 11, "E"], [18, 11, "E"]],
  sad: [[17, 7, "E"], [17, 8, "E"], [17, 12, "E"], [18, 11, "E"], [19, 12, "E"], [22, 3, "B"], [22, 4, "B"]],
};

const MOODS: Mood[] = ["happy", "normal", "sad"];

const FRONT_FRAMES = Object.fromEntries(MOODS.map((m) => [m, paint(FRONT, FRONT_FACE[m])])) as Record<Mood, Grid>;
const SIDE_FRAMES = Object.fromEntries(
  MOODS.map((m) => [m, SIDE_LIMBS.map((limbs) => paint(SIDE, [...limbs, ...SIDE_FACE[m]]))]),
) as Record<Mood, [Grid, Grid]>;

interface BoogiProps {
  /** front: 정면 인사, side: 옆모습(달리기) */
  pose?: "front" | "side";
  running?: boolean;
  mood?: Mood;
  /** 픽셀 하나의 화면 크기(px) */
  scale?: number;
  className?: string;
}

export function Boogi({ pose = "side", running = false, mood = "happy", scale = 3, className }: BoogiProps) {
  const [frame, setFrame] = useState<0 | 1>(0);

  useEffect(() => {
    if (!running) {
      setFrame(0);
      return;
    }
    const timer = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 120);
    return () => clearInterval(timer);
  }, [running]);

  const grid = pose === "front" ? FRONT_FRAMES[mood] : SIDE_FRAMES[mood][frame];
  const w = grid[0]!.length;
  const h = grid.length;

  return (
    <svg
      className={className}
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="상상부기"
    >
      {grid.flatMap((row, y) =>
        row.map((px, x) => (px ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COLORS[px]} /> : null)),
      )}
    </svg>
  );
}
