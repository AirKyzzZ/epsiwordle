"use client";

import { useWordle, GameStatus, GuessResult } from "@/hooks/use-wordle";
import { WordleBoard } from "@/components/wordle/wordle-board";
import { WordleKeyboard } from "@/components/wordle/wordle-keyboard";
import { useEffect, useState } from "react";
import { saveGame, validateWord } from "@/app/game/actions";
import { saveInfiniteGame } from "@/app/infinite/actions";
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
  isInfinite?: boolean;
  infiniteGameId?: string;
  onGameComplete?: () => void;
}

export function WordleGame({ word, wordId, definition, initialGameState, isInfinite = false, infiniteGameId, onGameComplete }: WordleGameProps) {
  const {
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
  } = useWordle(word, {
    initialGuesses: initialGameState?.guesses,
    initialStatus: initialGameState?.status
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(!!initialGameState);

  const handleEnter = async () => {
    if (gameStatus !== "playing") return;
    
    if (currentGuess.length !== wordLength) {
      onEnter(); // This triggers the shake in hook
      return;
    }

    try {
      const isValid = await validateWord(currentGuess);
      if (!isValid) {
        // Trigger shake animation instead of showing error message
        triggerShake();
        return;
      }
      onEnter();
    } catch (e) {
      console.error("Validation error", e);
      triggerShake();
    }
  };

  // Save game when it's completed
  useEffect(() => {
    if (gameStatus !== "playing" && !saved && !initialGameState) {
      setIsSaving(true);
      
      const savePromise = isInfinite && infiniteGameId
        ? saveInfiniteGame(infiniteGameId, guesses, gameStatus)
        : saveGame(wordId, guesses.length, guesses);
      
      savePromise
        .then(() => {
          setSaved(true);
          setIsSaving(false);
          if (onGameComplete) {
            onGameComplete();
          }
        })
        .catch((err) => {
          console.error("Failed to save game", err);
          setIsSaving(false);
        });
    }
  }, [gameStatus, guesses, wordId, saved, initialGameState, isInfinite, infiniteGameId, onGameComplete]);

  // For infinite mode, save progress incrementally (after each guess)
  useEffect(() => {
    if (isInfinite && infiniteGameId && guesses.length > 0 && gameStatus === "playing") {
      // Debounce saves to avoid too many API calls
      const timeoutId = setTimeout(() => {
        saveInfiniteGame(infiniteGameId, guesses, gameStatus).catch((err) => {
          console.error("Failed to save infinite game progress", err);
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [guesses, isInfinite, infiniteGameId, gameStatus]);

  if (initialGameState) {
    return (
      <div className="flex flex-col items-center">
        <WordleBoard 
          guesses={initialGameState.guesses} 
          currentGuess="" 
          gameStatus={initialGameState.status} 
          shakeRow={false}
          wordLength={word.length}
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
          {!isInfinite && (
            <Link 
              href="/stats"
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Voir mes statistiques
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* Removed error message display - only show shake animation */}
      
      <WordleBoard 
        guesses={guesses} 
        currentGuess={currentGuess} 
        gameStatus={gameStatus} 
        shakeRow={shakeRow}
        wordLength={wordLength}
      />
      
      {gameStatus === "playing" ? (
        <WordleKeyboard 
          onChar={onChar} 
          onDelete={onDelete} 
          onEnter={handleEnter} 
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
               
               {!isInfinite && (
                 <div className="flex gap-4 justify-center">
                    <Link 
                      href="/stats"
                      className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      Voir mes statistiques
                    </Link>
                 </div>
               )}
             </div>
          )}
        </div>
      )}
    </div>
  );
}
