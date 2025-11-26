import { useState, useEffect, useCallback } from "react";
import { getGuessStatuses, isWinningGuess, MAX_CHALLENGES, WORD_LENGTH, LetterStatus } from "@/lib/wordle/wordle-logic";

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

  const onChar = useCallback((char: string) => {
    if (gameStatus !== "playing" || currentGuess.length >= WORD_LENGTH) return;
    setCurrentGuess((prev) => prev + char.toUpperCase());
  }, [gameStatus, currentGuess]);

  const onDelete = useCallback(() => {
    if (gameStatus !== "playing") return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [gameStatus]);

  const onEnter = useCallback(() => {
    if (gameStatus !== "playing") return;

    if (currentGuess.length !== WORD_LENGTH) {
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 600);
      return;
    }

    // TODO: Add dictionary validation here if needed

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
  }, [gameStatus, currentGuess, guesses, solution]);

  return {
    currentGuess,
    guesses,
    gameStatus,
    shakeRow,
    onChar,
    onDelete,
    onEnter,
  };
}

