"use server";

import { createClient } from "@/lib/supabase/server";
import { saveGameAttempt } from "@/lib/wordle/daily";
import { revalidatePath } from "next/cache";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Global cache for dictionary words (persists across module reloads)
declare global {
  // eslint-disable-next-line no-var
  var __dictionaryCacheSet: Set<string> | undefined;
  // eslint-disable-next-line no-var
  var __dictionaryLoadError: string | undefined;
}

// Cache for dictionary words
let dictionaryWords: Set<string> | null = null;
let dictionaryLoadError: string | null = null;

function loadDictionary(): Set<string> {
  // Check module-level cache first
  if (dictionaryWords) {
    return dictionaryWords;
  }

  // Check global cache (survives hot reloads in dev, persists in production)
  if (global.__dictionaryCacheSet) {
    dictionaryWords = global.__dictionaryCacheSet;
    return dictionaryWords;
  }

  if (dictionaryLoadError || global.__dictionaryLoadError) {
    const error = dictionaryLoadError || global.__dictionaryLoadError;
    console.error("Dictionary already failed to load:", error);
    return new Set<string>();
  }

  try {
    const filePath = join(process.cwd(), "public", "dictionary.txt");
    
    if (!existsSync(filePath)) {
      dictionaryLoadError = `File not found at: ${filePath}`;
      global.__dictionaryLoadError = dictionaryLoadError;
      console.error(dictionaryLoadError);
      return new Set<string>();
    }

    console.log(`Loading dictionary from: ${filePath}`);
    const startTime = Date.now();
    const fileContent = readFileSync(filePath, "utf-8");
    
    // The file contains accented 5-letter words
    // We normalize them to standard uppercase (A-Z) for the validation Set
    const words = new Set<string>();
    const lines = fileContent.split("\n");
    
    for (const line of lines) {
      const word = line.trim();
      if (word && word.length === 5) {
         const normalized = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
         words.add(normalized);
      }
    }

    dictionaryWords = words;
    global.__dictionaryCacheSet = words; // Store in global cache
    const loadTime = Date.now() - startTime;
    console.log(`✓ Loaded ${words.size} unique normalized words from dictionary in ${loadTime}ms`);
    
    return words;
  } catch (error: any) {
    dictionaryLoadError = error.message;
    global.__dictionaryLoadError = error.message;
    console.error("Error loading dictionary:", error.message);
    console.error("Stack:", error.stack);
    return new Set<string>();
  }
}

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
  if (!word || word.length !== 5) {
    return false;
  }
  
  // Reject words with accents - guesses should be strictly A-Z
  const noAccentsPattern = /^[A-Z]+$/i;
  if (!noAccentsPattern.test(word)) {
    return false;
  }
  
  const upperWord = word.toUpperCase();
  
  // Load dictionary and check if word exists
  const dictionary = loadDictionary();
  
  if (dictionary.size === 0) {
    console.error(`⚠ Dictionary is empty! Cannot validate "${upperWord}".`);
  }
  
  if (dictionary.has(upperWord)) {
    return true;
  }
  
  // Also check if it's in our tech words list (if any)
  const supabase = await createClient();
  const { data: techWord } = await supabase
    .from("daily_words")
    .select("word")
    .eq("word", upperWord)
    .single();
    
  if (techWord) {
    return true;
  }
  
  return false;
}
