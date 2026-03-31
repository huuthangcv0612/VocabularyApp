const levels = ["A1.1", "A1.2", "A2.1", "A2.2", "B1"];

function LevelScreen({ onSelect }) {
  return (
    <div className="level-screen">
      <h1>Vocabulary Master</h1>

      <div className="level-button-row">
        {levels.map((lv) => (
          <button
            key={lv}
            className="level-btn"
            onClick={() => onSelect(lv)}
          >
            {lv}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LevelScreen;