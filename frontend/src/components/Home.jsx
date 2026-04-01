function Home({ onStart }) {
  return (
    <div className="home-screen">
      <header className="home-header">
        <h1>Flashcards Thông Minh</h1>
        <p>
          Ghi nhớ từ vựng hiệu quả với phương pháp lặp lại ngắt quãng. Học theo
          tiến độ của bạn, từ A1 đến B1.
        </p>
      </header>

      <button className="start-btn" onClick={onStart}>
        Bắt đầu Luyện tập
      </button>
    </div>
  );
}

export default Home;
