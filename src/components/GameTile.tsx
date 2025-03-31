import React, { useState, useEffect, useRef } from "react";

interface GameTileProps {
  target: string; // Define the target prop
}

const toCamelCase = (str: string) => {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const calculateScore = (guessTaxonomy: any, targetTaxonomy: any): number => {
  console.log("Guess:", guessTaxonomy, "Target:", targetTaxonomy);
  if (!guessTaxonomy || !targetTaxonomy) return 0.0;
  const {
    kingdom: gKingdom,
    order: gOrder,
    family: gFamily,
    genus: gGenus,
    species: gSpecies,
  } = guessTaxonomy;
  const {
    kingdom: tKingdom,
    order: tOrder,
    family: tFamily,
    genus: tGenus,
    species: tSpecies,
  } = targetTaxonomy;
  if (gSpecies === tSpecies && gGenus === tGenus) return 99.99;
  if (gGenus === tGenus) return 85.0;
  if (gFamily === tFamily) return 65.0;
  if (gOrder === tOrder) return 45.0;
  if (gKingdom === tKingdom) return 25.0;
  return 5.0;
};

const GameTile: React.FC<GameTileProps> = ({ target }) => {
  const [input, setInput] = useState<string>("");
  const [commonNames, setCommonNames] = useState<string[]>([]);
  const [filteredNames, setFilteredNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [guesses, setGuesses] = useState<{ name: string; score: number }[]>([]);
  const [targetTaxonomy, setTargetTaxonomy] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    // Fetch common names
    fetch("https://kingdom.vercel.app/api/common-names")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch common names");
        return response.json();
      })
      .then((names: string[]) => {
        console.log("Common Names:", names.slice(0, 5));
        setCommonNames(names);
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError("Failed to load names: " + errorMessage);
      });

    // Fetch taxonomy for the target
    if (target) {
      fetch(
        `https://kingdom.vercel.app/api/taxonomy?name=${encodeURIComponent(
          target
        )}`
      )
        .then((response) => {
          if (!response.ok) throw new Error("Target taxonomy failed");
          return response.json();
        })
        .then((taxonomy) => {
          console.log("Target Taxonomy:", taxonomy);
          setTargetTaxonomy(taxonomy);
        })
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError("Failed to load target taxonomy: " + errorMessage);
          // Fallback taxonomy
          setTargetTaxonomy({
            kingdom: "Animalia",
            order: "Passeriformes",
            family: "Cardinalidae",
            genus: "Cardinalis",
            species: "Cardinalis cardinalis",
          });
        });
    } else {
      setError("No target provided");
    }
  }, [target]); // Re-run if target changes

  useEffect(() => {
    if (input.length >= 3) {
      const inputLower = input.toLowerCase().trim();
      const filtered = commonNames.filter((name) =>
        name.toLowerCase().includes(inputLower)
      );
      console.log("Input:", inputLower, "Filtered:", filtered.slice(0, 5));
      setFilteredNames(filtered);
      setSelectedName(filtered.length === 1 ? filtered[0] : "");
    } else {
      setFilteredNames([]);
      setSelectedName("");
    }
  }, [input, commonNames]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log("Selected:", value);
    setSelectedName(value);
    setInput(value);
    setFilteredNames([]);
  };

  const handleSubmit = () => {
    console.log(
      "Submitting:",
      selectedName,
      "Target Taxonomy:",
      targetTaxonomy
    );
    if (!selectedName || !targetTaxonomy) {
      setError("Missing selection or target not loaded.");
      return;
    }

    fetch(
      `https://kingdom.vercel.app/api/taxonomy?name=${encodeURIComponent(
        selectedName
      )}`
    )
      .then((response) => {
        if (!response.ok)
          throw new Error(`Taxonomy fetch failed: ${response.status}`);
        return response.json();
      })
      .then((guessTaxonomy) => {
        const score = calculateScore(guessTaxonomy, targetTaxonomy);
        console.log("Score:", score);
        setGuesses([...guesses, { name: selectedName, score }]);
        setSelectedName("");
        setInput("");
        setFilteredNames([]);
        setError("");
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError("Submission failed: " + errorMessage);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && selectedName) {
      handleSubmit();
    } else if (e.key === "ArrowDown" && filteredNames.length > 0) {
      e.preventDefault();
      selectRef.current?.focus();
    }
  };

  return (
    <div className="game-tile">
      <div className="dropdown-section">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type 3+ letters of a common name"
          className="bird-input"
        />
        {filteredNames.length > 0 && (
          <select
            ref={selectRef}
            value={selectedName}
            onChange={handleSelectChange}
            className="bird-dropdown"
            size={Math.min(filteredNames.length, 5)}
          >
            <option value="" disabled>
              Select a name
            </option>
            {filteredNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={handleSubmit}
          className="submit-button"
          disabled={!selectedName || !targetTaxonomy}
        >
          Submit Guess
        </button>
        {error && <p className="error">{error}</p>}
      </div>
      <div className="guesses-section">
        <h3>Guesses (Target: {target || "Loading..."})</h3>
        {guesses.length === 0 ? (
          <p>No guesses yet.</p>
        ) : (
          <ul>
            {guesses.map((guess, index) => (
              <li
                key={index}
                className={guess.score >= 99.99 ? "correct" : "incorrect"}
              >
                {guess.name} .... Score: {guess.score.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GameTile;
