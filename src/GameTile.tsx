import React, { useState, useEffect, useRef } from "react";

interface Taxonomy {
  kingdom?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
}

interface TargetData {
  common_name: string;
  clue1: string;
  clue2: string;
  clue3: string;
  clue4: string;
  clue5: string;
  clue6: string;
  photo_url: string;
}

interface Guess {
  name: string;
  score: number;
}

const toCamelCase = (str: string): string =>
  str.toLowerCase().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const GameTile: React.FC<{ target: TargetData }> = ({ target }) => {
  const [input, setInput] = useState<string>("");
  const [commonNames, setCommonNames] = useState<string[]>([]);
  const [filteredNames, setFilteredNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [targetTaxonomy, setTargetTaxonomy] = useState<Taxonomy | null>(null);
  const [error, setError] = useState<string>("");
  const [clueIndex, setClueIndex] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    fetch("/api/common-names")
      .then((res) => res.json())
      .then((data: string[]) => {  // Type the API response
        const namesSet = new Set(data.map((item: string) => toCamelCase(item)));
        setCommonNames(Array.from(namesSet));
      })
      .catch((err) => setError("Failed to load names: " + err.message));

    fetch(`/api/taxonomy?name=${encodeURIComponent(target.common_name)}`)
      .then((res) => res.json())
      .then((taxonomy: Taxonomy) => setTargetTaxonomy(taxonomy))
      .catch((err) => setError("Failed to load target: " + err.message));
  }, [target]);

  useEffect(() => {
    if (input.length >= 3) {
      const filtered = commonNames
        .filter((name) => name.toLowerCase().includes(input.toLowerCase().trim()))
        .slice(0, 50);
      setFilteredNames(filtered);
      setSelectedName(filtered.length === 1 ? filtered[0] : "");
    } else {
      setFilteredNames([]);
      setSelectedName("");
    }
  }, [input, commonNames]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedName(value);
    setInput(value);
    setFilteredNames([]);
    inputRef.current?.focus();
  };

  const calculateScore = (guessTaxonomy: Taxonomy, targetTaxonomy: Taxonomy): number => {
    if (!guessTaxonomy || !targetTaxonomy) return 0.0;
    const { kingdom: gK, order: gO, family: gF, genus: gG, species: gS } = guessTaxonomy;
    const { kingdom: tK, order: tO, family: tF, genus: tG, species: tS } = targetTaxonomy;
    if (selectedName === target.common_name) return 100.0;
    if (gS === tS && gG === tG) return 99.99;
    if (gG === tG) return 85.0;
    if (gF === tF) return 65.0;
    if (gO === tO) return 45.0;
    if (gK === tK) return 25.0;
    return 5.0;
  };

  const handleSubmit = () => {
    if (!selectedName || !targetTaxonomy) {
      setError("Missing selection or target not loaded.");
      return;
    }

    fetch(`/api/taxonomy?name=${encodeURIComponent(selectedName)}`)
      .then((res) => res.json())
      .then((guessTaxonomy: Taxonomy) => {
        const score = calculateScore(guessTaxonomy, targetTaxonomy);
        const newGuesses = [...guesses, { name: selectedName, score }];
        setGuesses(newGuesses);

        if (score >= 100) {
          setError("Correct! You win!");
        } else if (clueIndex < 6) {
          setClueIndex(clueIndex + 1);
        } else {
          const bestGuess = newGuesses.reduce((max, g) => (g.score > max.score ? g : max), newGuesses[0]);
          setError(`Game over! Best Guess: ${bestGuess.name}, Score: ${bestGuess.score.toFixed(2)}`);
        }

        setSelectedName("");
        setInput("");
        setFilteredNames([]);
      })
      .catch((err) => setError("Submission failed: " + err.message));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && selectedName) handleSubmit();
    else if (e.key === "ArrowDown" && filteredNames.length > 0) {
      e.preventDefault();
      selectRef.current?.focus();
    }
  };

  const getClue = (index: number): string => {
    return target[`clue${index}` as keyof TargetData] as string;  // Type assertion for dynamic key
  };

  const blurLevel = 6 - clueIndex;

  return (
    <div className="game-tile">
      <div className="clue-section">
        <p>Clue #{clueIndex}: {getClue(clueIndex)}</p>
        <img
          src={target.photo_url}
          alt="Target species"
          style={{ filter: `blur(${blurLevel}px)`, maxWidth: "300px" }}
        />
      </div>
      <div className="dropdown-section">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type 3+ letters"
        />
        {filteredNames.length > 0 && (
          <select
            ref={selectRef}
            value={selectedName}
            onChange={handleSelectChange}
            size={Math.min(filteredNames.length, 5)}
          >
            <option value="" disabled>Select a name</option>
            {filteredNames.map((name, index) => (
              <option key={`${name}-${index}`} value={name}>{name}</option>
            ))}
          </select>
        )}
        <button onClick={handleSubmit} disabled={!selectedName || guesses.length >= 6}>
          Submit Guess
        </button>
        {error && <p className="error">{error}</p>}
      </div>
      <div className="guesses-section">
        <h3>Guesses (Target: {target.common_name})</h3>
        {guesses.length === 0 ? (
          <p>No guesses yet.</p>
        ) : (
          <ul>
            {guesses.map((guess, index) => (
              <li key={index} className={guess.score >= 100 ? "correct" : "incorrect"}>
                {guess.name} - Score: {guess.score.toFixed(2)}
                {guess.score >= 100 && " (Correct!)"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GameTile;

