import React, { useState, useEffect } from "react";
import GameTile from "./components/GameTile";
import "./App.css";

function App() {
  const [targetData, setTargetData] = useState(null);

  useEffect(() => {
    fetch("/api/daily-target")
      .then((res) => res.json())
      .then((data) => setTargetData(data));
  }, []);

  if (!targetData) return <div>Loading...</div>;

  return (
    <div className="app">
      <div className="top-bar">
        <button className="kingdom-button" onClick={() => window.location.reload()}>
          Kingdom
        </button>
      </div>
      <GameTile target={targetData} />
    </div>
  );
}

export default App;
