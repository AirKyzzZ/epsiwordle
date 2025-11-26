import { useState, useEffect, useCallback } from "react";
import { getGuessStatuses, isWinningGuess, MAX_CHALLENGES, LetterStatus } from "@/lib/wordle/wordle-logic";

export type GameStatus = "playing" | "won" | "lost";

export type GuessResult = {
  word: string;
  statuses: LetterStatus[];
};

export function useWordle(solution: string) {
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [shakeRow, setShakeRow] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wordLength = solution.length;

  const triggerShake = useCallback(() => {
    setShakeRow(true);
    setTimeout(() => setShakeRow(false), 600);
  }, []);

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
      triggerShake();
      return;
    }

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
  }, [gameStatus, currentGuess, guesses, solution, wordLength, triggerShake]);

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
    triggerShake,
    setErrorMessage,
  };
}
