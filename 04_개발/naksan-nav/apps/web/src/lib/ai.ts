import type { Paper, Professor } from "../types";

export interface ProfessorBrief {
  headline: string;
  papers: Paper[];
}

/**
 * 교수 논문 요약. 지금은 미리 써둔 설명을 지연 후 돌려주는 목업이다.
 * 실제로는 backend 가 논문 메타데이터(RISS·KCI 등)를 모아 LLM 에 요약을 요청하고,
 * 키는 서버에만 둔다(ai/rag 어댑터로 HSU AI HUB 교체 가능).
 */
export function briefProfessor(prof: Professor, signal?: AbortSignal): Promise<ProfessorBrief> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve({
        headline: `${prof.name} 교수님은 '${prof.focus}'에 집중하는 연구자예요. 최근 논문 3편을 보면, 이론보다 실제 현장에서 바로 쓸 수 있는 결과를 내는 걸 중요하게 여기는 편이에요.`,
        papers: prof.papers,
      });
    }, 1400);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}
