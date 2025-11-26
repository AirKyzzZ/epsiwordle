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

