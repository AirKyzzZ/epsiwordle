import { getDailyWord, getUserGameState } from "@/lib/wordle/daily";
import { createClient } from "@/lib/supabase/server";
import { WordleGame } from "@/components/game/wordle-game";
import { redirect } from "next/navigation";

export default async function GamePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const dailyWord = await getDailyWord();

  if (!dailyWord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Pas de mot pour aujourd'hui !</h1>
        <p className="text-gray-600 dark:text-gray-400">Revenez demain pour un nouveau défi.</p>
      </div>
    );
  }

  // Check if user already played
  const existingGame = await getUserGameState(user.id, dailyWord.id);
  
  let initialGameState = null;
  if (existingGame) {
    const isWin = existingGame.guesses[existingGame.guesses.length - 1].statuses.every((s: any) => s === "correct");
    initialGameState = {
      guesses: existingGame.guesses,
      status: isWin ? "won" : (existingGame.guesses.length >= 6 ? "lost" : "playing") // Actually if saved, it's done.
    };
    // If existing game logic in DB only stores completed games, then it's won or lost.
    // If we stored partial games, we'd need to handle that. Assuming we only store completed games for now based on the client logic.
  }

  return (
    <div className="container mx-auto px-4 py-8">
      
      <WordleGame 
        word={dailyWord.word} 
        wordId={dailyWord.id}
        definition={dailyWord.definition}
        initialGameState={initialGameState as any}
      />
    </div>
  );
}

