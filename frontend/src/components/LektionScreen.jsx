function LektionScreen({ words, onSelect, onBack }) {
  // Get unique lektions from words
  const lektions = [...new Set(words.map(w => w.lektion))].sort();

  return (
    <div className="lektion-screen">
      <button onClick={onBack} className="back-left-btn">← Back to Levels</button>

      <h1 className="lektion-title">Chọn Lektion</h1>

      <div className="level-button-row">
        {lektions.map((lk) => {
          const count = words.filter(w => w.lektion === lk).length;
          return (
            <button
              key={lk}
              className="level-btn"
              onClick={() => onSelect(lk)}
            >
              <div>{lk}</div>
              <div className="level-count">({count} từ)</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LektionScreen;
