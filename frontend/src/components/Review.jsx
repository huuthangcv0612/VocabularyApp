import { useCallback, useEffect, useState } from "react";

function Review({ words, setView }) {
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState(false);

  const hasWords = words && words.length > 0;

  const prevCard = useCallback(() => {
    setFlip(false);
    setIndex((i) => (i > 0 ? i - 1 : words.length - 1));
  }, [words.length]);

  const nextCard = useCallback(() => {
    setFlip(false);
    setIndex((i) => (i < words.length - 1 ? i + 1 : 0));
  }, [words.length]);

  useEffect(() => {
    if (!hasWords) return;

    const handler = (e) => {
      if (e.key === "Enter") {
        setFlip((f) => !f);
      }
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasWords, nextCard, prevCard]);

  if (!hasWords) return <p>Không có dữ liệu</p>;

  const word = words[index];

  return (
    <div className="review-screen">
      <button className="back-left-btn" onClick={() => setView("dashboard")}>← Back</button>

      <div className="flashcard-container" onClick={() => setFlip((f) => !f)}>
        <div className={`flashcard ${flip ? "flipped" : ""}`}>
          <div className="flashcard-front"><span>{word.word}</span></div>
          <div className="flashcard-back"><span>{word.meaning || "--"}</span></div>
        </div>
      </div>

      <div className="card-nav">
        <button className="nav-btn" onClick={prevCard}>⬅ Trước</button>
        <span>{index + 1}/{words.length}</span>
        <button className="nav-btn" onClick={nextCard}>Sau ➡</button>
      </div>

      <small className="hint">Nhấn ENTER hoặc click vào thẻ để lật</small>
    </div>
  );
}

export default Review;