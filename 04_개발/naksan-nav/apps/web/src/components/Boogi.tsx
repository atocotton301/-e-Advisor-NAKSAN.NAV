import type { Mood } from "../types";
import back from "../assets/boogi/back.png";
import eat from "../assets/boogi/eat.png";
import front from "../assets/boogi/front.png";
import frontShell from "../assets/boogi/front-shell.png";
import grad from "../assets/boogi/grad.png";
import side from "../assets/boogi/side.png";
import wave from "../assets/boogi/wave.png";

// 한성대학교 공식 캐릭터 '상상부기' (ⓒ 한성대학교, 사용 허락을 받아 사용).
// 원본: 한성대 홈페이지 「한성상징」 상상부기 이미지.

export const BOOGI = { back, eat, front, frontShell, grad, side, wave };

interface BoogiProps {
  /** front: 정면, side: 옆모습(걷기) */
  pose?: "front" | "side";
  running?: boolean;
  mood?: Mood;
  /** 크기 배율. 높이 = 26 × scale px */
  scale?: number;
  className?: string;
  /** 정면일 때 특정 포즈를 직접 고른다 */
  variant?: keyof typeof BOOGI;
}

export function Boogi({ pose = "side", mood = "happy", scale = 3, className, variant }: BoogiProps) {
  const src = variant
    ? BOOGI[variant]
    : pose === "side"
      ? side
      : mood === "happy"
        ? grad
        : mood === "normal"
          ? frontShell
          : front;
  const height = 26 * scale;
  return (
    <img
      className={`boogi ${pose === "side" ? "boogi--side" : ""} ${mood === "sad" ? "boogi--sad" : ""} ${className ?? ""}`}
      src={src}
      height={height}
      style={{ height, width: "auto" }}
      alt="상상부기"
      draggable={false}
    />
  );
}
