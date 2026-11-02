import { useState } from "react";
import { INTEREST_GROUPS, MAX_INTERESTS, MIN_INTERESTS } from "../data/interests";

interface InterestPickerProps {
  trackName: string;
  initial: string[];
  onBack: () => void;
  onConfirm: (tags: string[]) => void;
}

export function InterestPicker({ trackName, initial, onBack, onConfirm }: InterestPickerProps) {
  const [picked, setPicked] = useState<string[]>(initial);
  const full = picked.length >= MAX_INTERESTS;

  const toggle = (tag: string) =>
    setPicked((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : full ? prev : [...prev, tag]));

  return (
    <div className="card interests">
      <header className="card__head">
        <h2>무엇에 관심 있나요?</h2>
        <p>
          고른 해시태그로 프로파일을 만들어 <b>{trackName}</b> 과목 중 잘 맞을 과목을 먼저 보여드릴게요. ({MIN_INTERESTS}~
          {MAX_INTERESTS}개)
        </p>
      </header>

      <div className="tag-groups">
        {INTEREST_GROUPS.map((group) => (
          <section key={group.label}>
            <h3>{group.label}</h3>
            <div className="tag-cloud">
              {group.tags.map((tag) => {
                const on = picked.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`hashtag ${on ? "is-on" : ""}`}
                    aria-pressed={on}
                    disabled={!on && full}
                    onClick={() => toggle(tag)}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="card__foot">
        <p className="picked-summary">
          {picked.length > 0 ? (
            <span className="profile-line">
              {picked.map((t) => `#${t}`).join(" ")}
            </span>
          ) : (
            <span className="picked-summary--empty">관심사를 골라주세요</span>
          )}
          <em>
            {picked.length} / {MAX_INTERESTS}
          </em>
        </p>
        <div className="card__actions">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            이전
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={picked.length < MIN_INTERESTS}
            onClick={() => onConfirm(picked)}
          >
            내 로드맵 만들기
          </button>
        </div>
      </footer>
    </div>
  );
}
