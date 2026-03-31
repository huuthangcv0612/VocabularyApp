import { useState } from "react";
import LevelScreen from "./components/LevelScreen";
import LektionScreen from "./components/LektionScreen";
import Dashboard from "./components/Dashboard";
import Review from "./components/Review";
import Quiz from "./components/Quiz";
import Wheel from "./components/Wheel";
import { useApp } from "./hooks/useApp";
import "./style/App.css";

function App() {
  const { level, setLevel, lektion, setLektion, words, setWords } = useApp();
  const [view, setView] = useState("dashboard"); 

  // load JSON theo level
  const loadWords = async (selectedLevel) => {
    try {
      const res = await fetch(`/data/${selectedLevel}.json`);
      const data = await res.json();
      setWords(data);
    } catch (err) {
      console.error("Lỗi load JSON", err);
    }
  };

  const handleSelectLevel = async (lv) => {
    setLevel(lv);
    setLektion(null); // Reset lektion when level changes
    await loadWords(lv);
    setView("lektion");
  };

  const handleSelectLektion = (lk) => {
    setLektion(lk);
    setView("dashboard");
  };

  const handleBackToLektion = () => {
    setLektion(null);
    setView("dashboard");
  };

  if (!level) {
    return <LevelScreen onSelect={handleSelectLevel} />;
  }

  if (!lektion) {
    return <LektionScreen words={words} onSelect={handleSelectLektion} onBack={() => setLevel(null)} />;
  }

  const filteredWords = words.filter(w => w.lektion === lektion);

  return (
    <div className="p-6">
      {view === "dashboard" && (
        <Dashboard setView={setView} onBackToLektion={handleBackToLektion} />
      )}

      {view === "review" && (
        <Review words={filteredWords} setView={setView} />
      )}

      {view === "quiz" && (
        <Quiz words={filteredWords} setView={setView} />
      )}

      {view === "wheel" && (
        <Wheel words={filteredWords} setView={setView} />
      )}
    </div>
  );
}

export default App;