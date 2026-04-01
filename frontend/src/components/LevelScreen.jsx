const levels = [
  {
    id: "A1.1",
    title: "Cấp độ A1.1",
    description: "Xây dựng nền tảng vững chắc với những câu chào hỏi và từ vựng cơ bản nhất.",
    status: "Hoàn thành",
    unlocked: true,
  },
  {
    id: "A1.2",
    title: "Cấp độ A1.2",
    description: "Nâng cao khả năng tương tác trong các tình huống sinh hoạt hàng ngày.",
    status: "Đang học",
    unlocked: true,
  },
  {
    id: "A2.1",
    title: "Cấp độ A2.1",
    description: "Mở rộng vốn từ vựng và bắt đầu làm quen với ngữ pháp phức tạp.",
    status: "Đang học",
    unlocked: true,
  },
  {
    id: "A2.2",
    title: "Cấp độ A2.2",
    description: "Tự tin diễn đạt ý kiến cá nhân và thảo luận những chủ đề quen thuộc.",
    status: "Đang học",
    unlocked: true,
  },
  {
    id: "B1.1",
    title: "Cấp độ B1.1",
    description: "Đột phá khả năng nghe hiểu và giao tiếp lưu loát trong môi trường làm việc.",
    status: "Đang học",
    unlocked: true,
  },
  {
    id: "B1.2",
    title: "Cấp độ B1.2",
    description: "Làm chủ ngôn ngữ chuyên sâu và sẵn sàng cho các kỳ thi chứng chỉ quốc tế.",
    status: "Khóa",
    unlocked: false,
  },
];

function LevelScreen({ onSelect }) {
  return (
    <div className="level-screen">
      <h1 className="level-title">Chọn Cấp độ học</h1>

      <div className="level-grid">
        {levels.map((level) => (
          <button
            key={level.id}
            className={`level-card ${level.unlocked ? "" : "locked"}`}
            onClick={() => level.unlocked && onSelect(level.id)}
            disabled={!level.unlocked}
          >
            <div className="level-card-icon">📘</div>
            <h2 className="level-card-title">{level.title}</h2>
            <p className="level-card-desc">{level.description}</p>
            <div className={`level-card-status ${level.status === "Hoàn thành" ? "done" : level.status === "Đang học" ? "active" : "locked"}`}>
              [{level.status}]
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LevelScreen;
