"use server";

import { createClient } from "@/lib/supabase/server";
import { saveGameAttempt } from "@/lib/wordle/daily";
import { revalidatePath } from "next/cache";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Cache for dictionary words
let dictionaryWords: Set<string> | null = null;
let dictionaryLoadError: string | null = null;

function loadDictionary(): Set<string> {
  if (dictionaryWords) {
    return dictionaryWords;
  }

  if (dictionaryLoadError) {
    console.error("Dictionary already failed to load:", dictionaryLoadError);
    return new Set<string>();
  }

  try {
    const filePath = join(process.cwd(), "public", "dictionnary.dic");
    
    if (!existsSync(filePath)) {
      dictionaryLoadError = `File not found at: ${filePath}`;
      console.error(dictionaryLoadError);
      return new Set<string>();
    }

    console.log(`Loading dictionary from: ${filePath}`);
    const fileContent = readFileSync(filePath, "utf-8");
    const words = new Set<string>();

    // Parse the .dic file format
    const lines = fileContent.split("\n");
    let processedCount = 0;
    
    for (const line of lines) {
      if (!line.trim()) continue;
      processedCount++;
      
      // Extract the first word (before comma if exists, otherwise before first dot)
      let word = line.trim();
      
      // If there's a comma, take the part before it
      if (word.includes(",")) {
        word = word.split(",")[0].trim();
      }
      
      // Remove everything after the first dot (tags)
      if (word.includes(".")) {
        word = word.split(".")[0].trim();
      }
      
      // Remove any trailing spaces or special characters (keep only letters)
      word = word.replace(/[^A-Za-zÀ-ÿ]/g, "").trim();
      
      if (!word || word.length < 2) continue;
      
      // Remove accents and convert to uppercase for comparison
      const normalizedWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      
      // Only add if it's a valid word (letters only, no special chars after normalization)
      if (/^[A-Z]+$/.test(normalizedWord)) {
        words.add(normalizedWord);
      }
    }

    dictionaryWords = words;
    console.log(`✓ Loaded ${words.size} words from dictionary (processed ${processedCount} lines)`);
    
    // Debug: check if "danse" is in the set
    if (words.has("DANSE")) {
      console.log("✓ 'DANSE' found in dictionary");
    } else {
      console.log("✗ 'DANSE' NOT found in dictionary");
      // Try to find similar words
      const similar = Array.from(words).filter(w => w.startsWith("DANS")).slice(0, 5);
      console.log("Similar words found:", similar);
    }
    
    return words;
  } catch (error: any) {
    dictionaryLoadError = error.message;
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
  if (!word || word.length < 2) {
    return false;
  }
  
  // Reject words with accents - only allow A-Z letters (no accents, no special chars)
  const noAccentsPattern = /^[A-Z]+$/i;
  if (!noAccentsPattern.test(word)) {
    return false;
  }
  
  const upperWord = word.toUpperCase();
  
  // Load dictionary and check if word exists
  const dictionary = loadDictionary();
  
  // Debug logging
  if (dictionary.size === 0) {
    console.error(`⚠ Dictionary is empty! Cannot validate "${upperWord}". Error: ${dictionaryLoadError || "Unknown"}`);
  }
  
  if (dictionary.has(upperWord)) {
    return true;
  }
  
  // Also check if it's in our tech words list
  const supabase = await createClient();
  const { data: techWord } = await supabase
    .from("daily_words")
    .select("word")
    .eq("word", upperWord)
    .single();
    
  if (techWord) {
    return true;
  }
  
  // Word not found in dictionary
  console.log(`✗ Word "${upperWord}" not found in dictionary (dict size: ${dictionary.size})`);
  return false;
}
