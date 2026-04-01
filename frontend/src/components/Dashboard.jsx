function Dashboard({ setView, onBackToLektion }) {
  const cards = [
    {
      key: "review",
      title: "Thẻ Ghi Nhớ Thông Minh",
      description: "Luyện tập từ vựng với flashcard, hình ảnh và ví dụ thực tế.",
      icon: "🧠",
      action: "Ôn tập",
    },
    {
      key: "quiz",
      title: "Trắc Nghiệm Phản Xạ",
      description: "Kiểm tra nhanh với quiz, tính điểm và phản hồi tức thì.",
      icon: "⚡",
      action: "Quiz",
    },
    {
      key: "wheel",
      title: "Vòng Quay Từ Vựng",
      description: "Chơi vòng quay ngẫu nhiên, tăng hứng thú và nhớ lâu.",
      icon: "🎯",
      action: "Vòng quay",
    },
  ];

  return (
    <div className="dashboard-screen">
      <button className="back-left-btn" onClick={onBackToLektion}>← Back to Lektion</button>

      <div className="dashboard-header">
        <h1>Chọn Phương Thức Học Tập</h1>
        <p>Khám phá các công cụ tương tác mạnh mẽ giúp bạn làm chủ tiếng Đức tự nhiên và đầy hứng khởi.</p>
      </div>

      <div className="dashboard-card-grid">
        {cards.map((card) => (
          <div key={card.key} className="dashboard-card">
            <div className="dashboard-card-icon">{card.icon}</div>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <button onClick={() => setView(card.key)} className="dashboard-card-btn">
              {card.action} ngay
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;