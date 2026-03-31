import { useState } from "react";
import { AppContext } from "./AppContext";

export default function AppProvider({ children }) {
  const [level, setLevel] = useState(null);
  const [lektion, setLektion] = useState(null);
  const [words, setWords] = useState([]);

  return (
    <AppContext.Provider value={{ level, setLevel, lektion, setLektion, words, setWords }}>
      {children}
    </AppContext.Provider>
  );
}