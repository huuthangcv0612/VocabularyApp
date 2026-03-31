function Dashboard({ setView, onBackToLektion }) {
  return (
    <div className="dashboard-screen">
      <button className="back-left-btn" onClick={onBackToLektion}>← Back to Lektion</button>

      <div className="dashboard-button-row">
        <button onClick={() => setView("review")} className="dashboard-btn">
          📖 Ôn tập
        </button>

        <button onClick={() => setView("quiz")} className="dashboard-btn">
          ✍️ Quiz
        </button>

        <button onClick={() => setView("wheel")} className="dashboard-btn">
          🎯 Vòng quay
        </button>
      </div>
    </div>
  );
}

export default Dashboard;