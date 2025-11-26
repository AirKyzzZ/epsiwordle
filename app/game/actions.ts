"use server";

import { createClient } from "@/lib/supabase/server";
import { saveGameAttempt } from "@/lib/wordle/daily";
import { revalidatePath } from "next/cache";

export async function saveGame(wordId: string, attempts: number, guesses: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await saveGameAttempt(user.id, wordId, attempts, guesses);
  
  if (result.error) {
    throw new Error(result.error);
  }

  revalidatePath("/game");
  return { success: true };
}

export async function validateWord(word: string): Promise<boolean> {
  // Check if word exists in our daily_words table first (if we have a large dictionary there)
  // Or check against an external API.
  // For this implementation, let's try to use a free dictionary API or just return true if we can't valid.
  // DictionaryAPI.dev is good but coverage for French might vary.
  // Let's try to use the daily_words table if we populated it with a lot of words, but user said "valid french word".
  // A real production app would have a dedicated dictionary table or service.
  
  // Fallback: allow the guess if we can't validate strictly, OR use a small embedded list for demo.
  // Let's check if the word is in our daily_words table (as a valid IT word at least).
  
  const supabase = await createClient();
  // We can check if the word exists in 'daily_words' if we treat that as our dictionary
  // But user wants ANY valid french word.
  
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/fr/${word}`);
    if (response.ok) {
      return true;
    }
    
    // If 404, it might not be in this specific API.
    // Let's try a second source or just be permissive for "IT jargon" that might not be in standard dicts.
    // But requirements said "valid french word".
    
    // Alternative: Check if it is in our known IT words list
    const { data } = await supabase
      .from("daily_words")
      .select("word")
      .eq("word", word.toUpperCase())
      .single();
      
    if (data) return true;
    
    return false;
  } catch (e) {
    console.error("Dictionary validation failed", e);
    // Fail open or closed? Let's fail open for UX if API is down.
    return true; 
  }
}
