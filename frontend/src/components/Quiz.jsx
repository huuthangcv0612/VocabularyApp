import { useState } from "react";

function Quiz({ words, setView }) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const [shuffledWords] = useState(() => {
    if (!words || words.length === 0) return [];
    return [...words].sort(() => Math.random() - 0.5);
  });

  const quizKey = words ? words.map((w) => w.word).join("|") : "empty";

  if (!shuffledWords || shuffledWords.length === 0) return <p>Không có dữ liệu</p>;

  const word = shuffledWords[index];

  const normalize = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/["'”“’‘]/g, "")
      .replace(/\s*[,/]+\s*/g, ",");

  const getAcceptedAnswers = (meaning) => {
    if (!meaning) return [];
    return normalize(meaning)
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
  };

  const check = () => {
    const userAnswer = normalize(input);
    const accepted = getAcceptedAnswers(word.meaning);

    const isExact = accepted.some((ans) => ans === userAnswer);
    const isPartial = accepted.some((ans) => {
      return (
        ans &&
        userAnswer &&
        (ans.includes(userAnswer) || userAnswer.includes(ans))
      );
    });

    if (isExact) {
      setResult("✅ Đúng");
    } else if (isPartial) {
      setResult(`✅ Gần đúng (đáp án dự kiến: ${word.meaning})`);
    } else {
      setResult(`❌ Sai: ${word.meaning}`);
    }
  };

  const handleNext = () => {
    if (index + 1 < shuffledWords.length) {
      setIndex(index + 1);
      setInput("");
      setResult("");
    } else {
      setResult("🎉 Hoàn thành!");
    }
  };

  return (
    <div key={quizKey} className="quiz-screen">
      <button className="back-left-btn" onClick={() => setView("dashboard")}>← Back</button>

      <h2 className="text-3xl mt-10 mb-6 font-bold">✍️ Quiz</h2>

      <div className="quiz-container max-w-md mx-auto">
        <div className="quiz-card p-8 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg rounded-lg">
          <p className="text-lg text-slate-600 mb-4">Dịch từ này:</p>
          <h3 className="text-4xl font-bold text-blue-600 mb-6">{word.word}</h3>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="quiz-input"
            placeholder="Nhập nghĩa của từ..."
            onKeyPress={(e) => e.key === "Enter" && check()}
          />

          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={check} className="check-btn">
              Check
            </button>
            <button onClick={handleNext} className="next-btn">
              Next →
            </button>
          </div>

          {result && (
            <div className={`mt-6 p-4 rounded-lg text-center font-semibold ${
              result.includes("✅") ? "bg-green-100 text-green-700" : 
              result.includes("❌") ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>
              {result}
            </div>
          )}

          <p className="mt-4 text-sm text-slate-500 text-center">
            Câu {index + 1} / {shuffledWords.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Quiz;