"use client";

import { useWordle, GameStatus, GuessResult } from "@/hooks/use-wordle";
import { WordleBoard } from "@/components/wordle/wordle-board";
import { WordleKeyboard } from "@/components/wordle/wordle-keyboard";
import { useEffect, useState } from "react";
import { saveGame } from "@/app/game/actions";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface WordleGameProps {
  word: string;
  wordId: string;
  definition: string;
  initialGameState?: {
    guesses: GuessResult[];
    status: GameStatus;
  } | null;
}

export function WordleGame({ word, wordId, definition, initialGameState }: WordleGameProps) {
  const {
    currentGuess,
    guesses,
    gameStatus,
    shakeRow,
    onChar,
    onDelete,
    onEnter,
  } = useWordle(word);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(!!initialGameState);

  useEffect(() => {
    if (gameStatus !== "playing" && !saved && !initialGameState) {
      setIsSaving(true);
      saveGame(wordId, guesses.length, guesses)
        .then(() => {
          setSaved(true);
          setIsSaving(false);
        })
        .catch((err) => {
          console.error("Failed to save game", err);
          setIsSaving(false);
        });
    }
  }, [gameStatus, guesses, wordId, saved, initialGameState]);

  // If we have initial state (already played), we should show that instead of a fresh game
  // But useWordle starts fresh. We might need to adapt useWordle or just display the board in "read only" if already played.
  // For simplicity here, if initialGameState is provided, we display it.

  if (initialGameState) {
    return (
      <div className="flex flex-col items-center">
        <WordleBoard 
          guesses={initialGameState.guesses} 
          currentGuess="" 
          gameStatus={initialGameState.status} 
          shakeRow={false} 
        />
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-2">
            {initialGameState.status === "won" ? "Bravo !" : "Dommage !"}
          </h2>
          <p className="text-lg mb-4">
            Le mot était : <span className="font-bold">{word}</span>
          </p>
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-6 max-w-md mx-auto">
            <h3 className="font-semibold mb-1">Définition :</h3>
            <p>{definition}</p>
          </div>
          <Link 
            href="/stats"
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Voir mes statistiques
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      <WordleBoard 
        guesses={guesses} 
        currentGuess={currentGuess} 
        gameStatus={gameStatus} 
        shakeRow={shakeRow} 
      />
      
      {gameStatus === "playing" ? (
        <WordleKeyboard 
          onChar={onChar} 
          onDelete={onDelete} 
          onEnter={onEnter} 
          guesses={guesses} 
        />
      ) : (
        <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-2">
            {gameStatus === "won" ? "Bravo !" : "Dommage !"}
          </h2>
          {isSaving ? (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sauvegarde...</span>
            </div>
          ) : (
             <div className="space-y-6">
               <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg max-w-md mx-auto">
                 <h3 className="font-semibold mb-1 text-emerald-600 dark:text-emerald-400">Définition :</h3>
                 <p className="text-gray-700 dark:text-gray-300">{definition}</p>
               </div>
               
               <div className="flex gap-4 justify-center">
                  <Link 
                    href="/stats"
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    Voir mes statistiques
                  </Link>
               </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

