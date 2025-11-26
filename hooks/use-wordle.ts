import { useState, useEffect, useCallback } from "react";
import { getGuessStatuses, isWinningGuess, MAX_CHALLENGES, LetterStatus } from "@/lib/wordle/wordle-logic";

export type GameStatus = "playing" | "won" | "lost";

export type GuessResult = {
  word: string;
  statuses: LetterStatus[];
};

// Helper to validate French words using a public API or local list
// Using a free API like dictionaryapi.dev (limited for French) or a large local list is better.
// For simplicity and performance, a local list is often preferred, or a server action.
// Let's assume we will add a server action validation or just a check against a known dictionary.
// For now, we'll allow any word for testing unless we implement the dictionary check.

export function useWordle(solution: string) {
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [shakeRow, setShakeRow] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wordLength = solution.length;

  const onChar = useCallback((char: string) => {
    if (gameStatus !== "playing" || currentGuess.length >= wordLength) return;
    setCurrentGuess((prev) => prev + char.toUpperCase());
    setErrorMessage(null);
  }, [gameStatus, currentGuess, wordLength]);

  const onDelete = useCallback(() => {
    if (gameStatus !== "playing") return;
    setCurrentGuess((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  }, [gameStatus]);

  const onEnter = useCallback(async () => {
    if (gameStatus !== "playing") return;

    if (currentGuess.length !== wordLength) {
      setShakeRow(true);
      setErrorMessage(`Le mot doit faire ${wordLength} lettres`);
      setTimeout(() => setShakeRow(false), 600);
      return;
    }

    // Validation logic would go here.
    // const isValid = await validateWord(currentGuess);
    // if (!isValid) { 
    //   setShakeRow(true); 
    //   setErrorMessage("Ce mot n'est pas dans le dictionnaire"); 
    //   setTimeout(() => setShakeRow(false), 600);
    //   return; 
    // }

    const statuses = getGuessStatuses(solution, currentGuess);
    const newGuessResult = { word: currentGuess, statuses };
    const newGuesses = [...guesses, newGuessResult];

    setGuesses(newGuesses);
    setCurrentGuess("");

    if (isWinningGuess(statuses)) {
      setGameStatus("won");
    } else if (newGuesses.length >= MAX_CHALLENGES) {
      setGameStatus("lost");
    }
  }, [gameStatus, currentGuess, guesses, solution, wordLength]);

  return {
    currentGuess,
    guesses,
    gameStatus,
    shakeRow,
    errorMessage,
    wordLength,
    onChar,
    onDelete,
    onEnter,
    setErrorMessage, // Exposing this if external validation needs to set it
  };
}
