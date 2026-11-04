import { useState } from "react";
import { average, CREDIT, type Review } from "../data/reviews";
import type { Activity } from "../types";

interface ActivityReviewsProps {
  activity: Activity;
  reviews: Review[];
  credits: number;
  unlocked: boolean;
  semesterLabel: string;
  onUnlock: () => void;
  onWrite: (review: Omit<Review, "id">) => void;
}

function Stars({ value, label, onPick }: { value: number; label: string; onPick?: (n: number) => void }) {
  return (
    <span className="stars" role={onPick ? "radiogroup" : undefined} aria-label={`${label} ${value}점`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onPick ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${label} ${n}점`}
            className={n <= value ? "is-on" : ""}
            onClick={() => onPick(n)}
          >
            ★
          </button>
        ) : (
          <i key={n} className={n <= Math.round(value) ? "is-on" : ""}>
            ★
          </i>
        ),
      )}
    </span>
  );
}

export function ActivityReviews({ activity, reviews, credits, unlocked, semesterLabel, onUnlock, onWrite }: ActivityReviewsProps) {
  const [writing, setWriting] = useState(false);
  const [rating, setRating] = useState(0);
  const [honey, setHoney] = useState(0);
  const [value, setValue] = useState(0);
  const [text, setText] = useState("");
  const wroteAlready = reviews.some((r) => r.mine);
  const canSubmit = rating > 0 && honey > 0 && value > 0 && text.trim().length >= 10;
  const canSee = unlocked || wroteAlready;

  return (
    <div className="rv">
      <header className="tt__head">
        <h2>{activity.name}</h2>
        <p>
          {activity.host} · {activity.points}pt
        </p>
      </header>

      <div className="rv__summary">
        <div>
          <span>만족도</span>
          <b>{average(reviews, "rating") || "—"}</b>
          <Stars value={average(reviews, "rating")} label="만족도" />
        </div>
        <div>
          <span>꿀지수</span>
          <b>{average(reviews, "honey") || "—"}</b>
          <small>부담 없는 정도</small>
        </div>
        <div>
          <span>혜자지수</span>
          <b>{average(reviews, "value") || "—"}</b>
          <small>얻는 것 대비 가성비</small>
        </div>
        <div>
          <span>후기</span>
          <b>{reviews.length}</b>
          <small>개</small>
        </div>
      </div>

      <div className="rv__wallet">
        <span>
          내 후기 크레딧 <b>{credits}</b>
        </span>
        <small>
          후기를 쓰면 {CREDIT.perReview}크레딧, 상세 후기 열람에 {CREDIT.unlockCost}크레딧. 크레딧은 앱 안에서만 쓰는 포인트이고 현금 가치는 없어요.
        </small>
      </div>

      {reviews.length > 0 &&
        (canSee ? (
          <ul className="rv__list">
            {reviews.map((r) => (
              <li key={r.id}>
                <div className="rv__meta">
                  <Stars value={r.rating} label="만족도" />
                  <span>
                    꿀 {r.honey} · 혜자 {r.value} · {r.semester}
                    {r.mine && " · 내 후기"}
                  </span>
                </div>
                <p>{r.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rv__locked">
            <ul aria-hidden>
              {reviews.slice(0, 2).map((r) => (
                <li key={r.id}>{r.text}</li>
              ))}
            </ul>
            <div>
              <b>상세 후기 {reviews.length}개가 잠겨 있어요</b>
              <button type="button" className="btn btn--primary btn--sm" disabled={credits < CREDIT.unlockCost} onClick={onUnlock}>
                {CREDIT.unlockCost}크레딧으로 열기
              </button>
              {credits < CREDIT.unlockCost && <small>후기를 하나 쓰면 바로 열 수 있어요.</small>}
            </div>
          </div>
        ))}

      {wroteAlready ? (
        <p className="rv__done">이 비교과에 후기를 남겼어요. 고마워요!</p>
      ) : writing ? (
        <div className="rv__form">
          <div className="rv__scores">
            <label>
              만족도 <Stars value={rating} label="만족도" onPick={setRating} />
            </label>
            <label>
              꿀지수 <Stars value={honey} label="꿀지수" onPick={setHoney} />
            </label>
            <label>
              혜자지수 <Stars value={value} label="혜자지수" onPick={setValue} />
            </label>
          </div>
          <textarea
            id={`rv-text-${activity.id}`}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="진행 방식, 과제·시간 부담, 얻은 것을 10자 이상 적어주세요. 익명으로 올라가요."
          />
          <div className="card__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setWriting(false)}>
              취소
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canSubmit}
              onClick={() => onWrite({ rating, honey, value, text: text.trim(), semester: semesterLabel, mine: true })}
            >
              후기 올리고 {CREDIT.perReview}크레딧 받기
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setWriting(true)}>
          후기 쓰고 {CREDIT.perReview}크레딧 받기
        </button>
      )}
    </div>
  );
}
