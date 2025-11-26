import clsx from "clsx";
import { GameStatus, GuessResult } from "@/hooks/use-wordle";
import { MAX_CHALLENGES, LetterStatus } from "@/lib/wordle/wordle-logic";
import { useEffect, useRef } from "react";

interface WordleBoardProps {
  guesses: GuessResult[];
  currentGuess: string;
  gameStatus: GameStatus;
  shakeRow: boolean;
  wordLength: number;
}

export function WordleBoard({ guesses, currentGuess, gameStatus, shakeRow, wordLength }: WordleBoardProps) {
  const empties = Array.from({ length: MAX_CHALLENGES - 1 - guesses.length }).fill("");
  const prevGuessesLength = useRef(guesses.length);

  useEffect(() => {
    prevGuessesLength.current = guesses.length;
  }, [guesses.length]);

  return (
    <div className="mb-6 grid grid-rows-6 gap-2">
      {guesses.map((guess, i) => (
        <CompletedRow 
          key={i} 
          guess={guess} 
          wordLength={wordLength} 
          isRevealing={i >= prevGuessesLength.current}
        />
      ))}
      {guesses.length < MAX_CHALLENGES && (
        <CurrentRow guess={currentGuess} shake={shakeRow} wordLength={wordLength} />
      )}
      {empties.map((_, i) => (
        <EmptyRow key={i} wordLength={wordLength} />
      ))}
    </div>
  );
}

function CompletedRow({ 
  guess, 
  wordLength, 
  isRevealing 
}: { 
  guess: GuessResult; 
  wordLength: number; 
  isRevealing: boolean; 
}) {
  return (
    <div className="flex gap-2 justify-center">
      {guess.word.split("").map((letter, i) => (
        <Cell 
          key={i} 
          letter={letter} 
          status={guess.statuses[i]} 
          isRevealing={isRevealing}
          revealDelay={i * 300} // 300ms stagger
        />
      ))}
    </div>
  );
}

function CurrentRow({ guess, shake, wordLength }: { guess: string; shake: boolean; wordLength: number }) {
  const splitGuess = guess.split("");
  const emptyCells = Array.from({ length: wordLength - splitGuess.length }).fill("");

  return (
    <div className={clsx("flex gap-2 justify-center", shake && "animate-shake")}>
      {splitGuess.map((letter, i) => (
        <Cell key={i} letter={letter} status="empty" isCompleted={false} />
      ))}
      {emptyCells.map((_, i) => (
        <Cell key={i} />
      ))}
    </div>
  );
}

function EmptyRow({ wordLength }: { wordLength: number }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: wordLength }).fill("").map((_, i) => (
        <Cell key={i} />
      ))}
    </div>
  );
}

function Cell({
  letter,
  status = "empty",
  isCompleted = true,
  isRevealing = false,
  revealDelay = 0,
}: {
  letter?: string;
  status?: LetterStatus;
  isCompleted?: boolean;
  isRevealing?: boolean;
  revealDelay?: number;
}) {
  const baseClasses =
    "flex h-14 w-14 items-center justify-center text-3xl font-bold uppercase border-2 select-none";
  
  const statusClasses = {
    correct: "bg-[#6aaa64] border-[#6aaa64] text-white",
    present: "bg-[#c9b458] border-[#c9b458] text-white",
    absent: "bg-[#787c7e] border-[#787c7e] text-white",
    empty: clsx(
      "bg-transparent",
      letter && !isCompleted ? "border-black dark:border-gray-400 animate-pop" : "border-gray-300 dark:border-gray-600"
    ),
  };

  const revealColors = {
    correct: "#6aaa64",
    present: "#c9b458",
    absent: "#787c7e",
    empty: "transparent"
  };

  const style = isRevealing && status !== 'empty' ? {
    '--reveal-bg': revealColors[status as keyof typeof revealColors],
    '--reveal-border': revealColors[status as keyof typeof revealColors],
    animationDelay: `${revealDelay}ms`
  } as React.CSSProperties : {};

  return (
    <div
      className={clsx(
        baseClasses,
        !isRevealing && statusClasses[status],
        isRevealing && "animate-reveal"
      )}
      style={style}
    >
      {letter}
    </div>
  );
}
