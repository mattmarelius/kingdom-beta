import React from "react";
import GameTile from "./components/GameTile";
import "./App.css";

function App() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="app">
      <div className="top-bar">
        <button className="kingdom-button" onClick={handleRefresh}>
          Kingdom
        </button>
      </div>
      <GameTile target="Northern Cardinal" /> {/* Set a valid target */}
    </div>
  );
}

export default App;
