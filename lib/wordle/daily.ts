import { createClient } from "@/lib/supabase/server";
import { addDays, format, startOfToday } from "date-fns";

export interface DailyWord {
  id: string;
  word: string;
  definition: string;
  date: string;
}

export async function getDailyWord(): Promise<DailyWord | null> {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("daily_words")
    .select("*")
    .eq("date", today)
    .single();

  if (error || !data) {
    console.error("Error fetching daily word:", error);
    return null;
  }

  return data as DailyWord;
}

export async function getUserGameState(userId: string, wordId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("game_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error("Error fetching user game state:", error);
  }

  return data;
}

export async function saveGameAttempt(userId: string, wordId: string, attempts: number, guesses: any[]) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("game_attempts")
    .insert({
      user_id: userId,
      word_id: wordId,
      attempts,
      guesses
    });

  if (error) {
    console.error("Error saving game attempt:", error);
    return { error: error.message };
  }

  return { success: true };
}

