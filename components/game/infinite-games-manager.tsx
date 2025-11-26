"use client";

import { useState, useEffect } from "react";
import { WordleGame } from "@/components/game/wordle-game";
import { 
  createInfiniteGame, 
  getInfiniteGames, 
  deleteInfiniteGame,
  type InfiniteGame 
} from "@/app/infinite/actions";
import { Plus, X, Loader2 } from "lucide-react";

export function InfiniteGamesManager() {
  const [games, setGames] = useState<InfiniteGame[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadGames = async () => {
    setIsLoading(true);
    const result = await getInfiniteGames();
    if (result.success && result.games) {
      setGames(result.games);
      // Set the first game as active, or the most recent one
      if (result.games.length > 0 && !activeGameId) {
        setActiveGameId(result.games[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handleCreateGame = async () => {
    setIsCreating(true);
    const result = await createInfiniteGame();
    if (result.success && result.game) {
      setGames(prev => [result.game!, ...prev]);
      setActiveGameId(result.game.id);
    }
    setIsCreating(false);
  };

  const handleDeleteGame = async (gameId: string) => {
    const result = await deleteInfiniteGame(gameId);
    if (result.success) {
      setGames(prev => {
        const remainingGames = prev.filter(g => g.id !== gameId);
        // If we deleted the active game, switch to another one
        if (activeGameId === gameId) {
          setActiveGameId(remainingGames.length > 0 ? remainingGames[0].id : null);
        }
        return remainingGames;
      });
    }
  };

  const activeGame = games.find(g => g.id === activeGameId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Game Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-800">
          {games.map((game) => {
            const gameState = game.game_state;
            const isActive = game.id === activeGameId;
            const isCompleted = gameState.status === "won" || gameState.status === "lost";
            const statusEmoji = gameState.status === "won" ? "✅" : gameState.status === "lost" ? "❌" : "🔄";
            
            return (
              <div
                key={game.id}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-colors
                  ${isActive 
                    ? "bg-emerald-600 text-white" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }
                  min-w-fit
                `}
                onClick={() => setActiveGameId(game.id)}
              >
                <span className="text-sm font-medium">
                  {statusEmoji} {gameState.guesses.length}/6
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGame(game.id);
                  }}
                  className={`
                    ml-1 p-1 rounded hover:bg-opacity-80
                    ${isActive ? "hover:bg-white/20" : "hover:bg-gray-300 dark:hover:bg-gray-600"}
                  `}
                  title="Supprimer cette partie"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          
          <button
            onClick={handleCreateGame}
            disabled={isCreating}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors
              ${isCreating 
                ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed" 
                : "bg-emerald-600 text-white hover:bg-emerald-500"
              }
              min-w-fit
            `}
            title="Créer une nouvelle partie"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            <span className="text-sm font-medium">Nouveau</span>
          </button>
        </div>
      </div>

      {/* Active Game */}
      {activeGame ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
          <WordleGame
            word={activeGame.word}
            wordId={activeGame.id}
            definition={activeGame.definition}
            initialGameState={
              activeGame.game_state.guesses.length > 0 || activeGame.game_state.status !== "playing"
                ? {
                    guesses: activeGame.game_state.guesses.map((g: any) => ({
                      word: g.word,
                      statuses: g.statuses
                    })),
                    status: activeGame.game_state.status
                  }
                : null
            }
            isInfinite={true}
            infiniteGameId={activeGame.id}
            onGameComplete={() => {
              loadGames(); // Reload to update game status
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Aucune partie en cours</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Créez votre première partie infinie pour commencer !
          </p>
          <button
            onClick={handleCreateGame}
            disabled={isCreating}
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors
              ${isCreating 
                ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed" 
                : "bg-emerald-600 text-white hover:bg-emerald-500"
              }
            `}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Création...</span>
              </>
            ) : (
              <>
                <Plus size={20} />
                <span>Créer une partie</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
