"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Global cache for dictionary words (persists across module reloads)
declare global {
  // eslint-disable-next-line no-var
  var __dictionaryCacheSet: Set<string> | undefined;
  // eslint-disable-next-line no-var
  var __dictionaryLoadError: string | undefined;
  // eslint-disable-next-line no-var
  var __dictionaryCache: string[] | undefined;
}

// Cache for dictionary words
let dictionaryWords: string[] | null = null;

function loadDictionary(): string[] {
  // Check module-level cache first
  if (dictionaryWords) {
    return dictionaryWords;
  }

  // Check global cache (survives hot reloads in dev, persists in production)
  if (global.__dictionaryCache) {
    dictionaryWords = global.__dictionaryCache;
    return dictionaryWords;
  }

  try {
    const filePath = join(process.cwd(), "public", "dictionary.txt");
    
    if (!existsSync(filePath)) {
      console.error(`Dictionary file not found at: ${filePath}`);
      return [];
    }

    console.log(`Loading dictionary from: ${filePath}`);
    const startTime = Date.now();
    const fileContent = readFileSync(filePath, "utf-8");
    
    // The file is already pre-processed: one 5-letter word per line (accented)
    const words = fileContent
      .split("\n")
      .map(w => w.trim())
      .filter(w => w.length === 5);

    dictionaryWords = words;
    global.__dictionaryCache = words; // Store in global cache
    const loadTime = Date.now() - startTime;
    console.log(`✓ Loaded ${words.length} words from dictionary in ${loadTime}ms`);
    return words;
  } catch (error: any) {
    console.error("Error loading dictionary:", error.message);
    return [];
  }
}

async function getDefinitionFromAPI(word: string): Promise<string> {
  // Try multiple word variations to find the definition
  const wordVariations = [
    word, // Original word (lowercase from dictionary)
    word.charAt(0).toUpperCase() + word.slice(1), // Capitalized
    word.toUpperCase(), // Uppercase
  ];

  for (const wordToTry of wordVariations) {
    try {
      const response = await fetch(
        `https://fr.wiktionary.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(wordToTry)}&explaintext=1&redirects=1`,
        {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'WordleFr/1.0 (education project)' }
        }
      );
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const pages = data.query?.pages;
      if (!pages) continue;
      
      const pageId = Object.keys(pages)[0];
      if (pageId === "-1") continue; // Page not found
      
      const extract = pages[pageId].extract;
      if (!extract || extract.trim().length === 0) continue;
      
      // Try to find French section
      let frenchSection = extract.split("== Français ==")[1];
      if (!frenchSection) {
        // Try alternative French section headers
        frenchSection = extract.split("==Français==")[1] || 
                       extract.split("== FRANÇAIS ==")[1] ||
                       extract; // Use whole extract as fallback
      }
      
      if (frenchSection) {
        // Split by newlines and process
        const lines = frenchSection
          .split("\n")
          .map((l: string) => l.trim())
          .filter((l: string) => l.length > 0 && l.length < 500); // Filter out very long lines
        
        for (const line of lines) {
          // Skip headers
          if (line.startsWith("=")) continue;
          
          // Skip pronunciation and metadata lines
          if (line.includes("\\") || 
              line.includes("{{") || 
              line.includes("[[") ||
              line.startsWith("Étymologie") ||
              line.startsWith("Prononciation") ||
              line.startsWith("Synonymes") ||
              line.startsWith("Antonymes") ||
              line.match(/^[A-ZÀ-ÖØ-ÞŒ]{1,3}$/)) {
            continue;
          }
          
          // Look for definition patterns
          if (line.length >= 10) {
            // Clean up the definition
            let definition = line
              .replace(/^[0-9]+[\.\)]\s*/, "") // Remove "1. " or "1) "
              .replace(/^\([^)]+\)\s*/, "") // Remove parenthetical notes at start
              .replace(/\s+/g, " ") // Normalize whitespace
              .trim();
            
            // If it looks like a valid definition
            if (definition.length >= 10 && 
                !definition.match(/^(masculin|féminin|verbe|nom|adjectif|adverbe)$/i) &&
                !definition.startsWith("Voir aussi") &&
                !definition.startsWith("Références")) {
              return definition.substring(0, 200); // Limit length
            }
          }
        }
        
        // If no definition found in structured format, try to extract from first paragraph
        const firstParagraph = frenchSection
          .split("\n\n")[0]
          .replace(/\n/g, " ")
          .trim();
        
        if (firstParagraph.length >= 20 && firstParagraph.length < 300) {
          // Clean up paragraph
          let definition = firstParagraph
            .replace(/^[A-ZÀ-ÖØ-ÞŒ]{1,5}\s+/, "") // Remove word at start
            .replace(/\([^)]*\)/g, "") // Remove parenthetical notes
            .replace(/\s+/g, " ")
            .trim();
          
          if (definition.length >= 15) {
            return definition.substring(0, 200);
          }
        }
      }
      
      // Last resort: return a cleaned excerpt from the extract
      const cleaned = extract
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      
      if (cleaned.length > 50) {
        return cleaned.substring(0, 200) + (cleaned.length > 200 ? "..." : "");
      }
      
    } catch (e) {
      // Try next variation
      continue;
    }
  }
  
  // If all variations failed, return a generic message
  return `Définition non disponible pour "${word}"`;
}

async function generateRandomWord(): Promise<{ word: string; definition: string }> {
  const dictionary = loadDictionary();
  
  if (dictionary.length === 0) {
    throw new Error("Dictionary is empty");
  }
  
  // Pick a random word
  const randomIndex = Math.floor(Math.random() * dictionary.length);
  const selectedWord = dictionary[randomIndex];
  
  const definition = await getDefinitionFromAPI(selectedWord);
  const normalizedWord = selectedWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  
  return { word: normalizedWord, definition: `(${selectedWord}) ${definition}` };
}

export interface InfiniteGame {
  id: string;
  word: string;
  definition: string;
  game_state: {
    guesses: Array<{ word: string; statuses: string[] }>;
    status: "playing" | "won" | "lost";
  };
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export async function createInfiniteGame(): Promise<{ success: boolean; game?: InfiniteGame; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { word, definition } = await generateRandomWord();
    
    const { data, error } = await supabase
      .from("infinite_games")
      .insert({
        user_id: user.id,
        word,
        definition,
        game_state: {
          guesses: [],
          status: "playing"
        }
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating infinite game:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/infinite");
    return { success: true, game: data as InfiniteGame };
  } catch (error: any) {
    console.error("Error generating word:", error);
    return { success: false, error: error.message };
  }
}

export async function getInfiniteGames(): Promise<{ success: boolean; games?: InfiniteGame[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("infinite_games")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching infinite games:", error);
    return { success: false, error: error.message };
  }

  return { success: true, games: (data || []) as InfiniteGame[] };
}

export async function getInfiniteGame(gameId: string): Promise<{ success: boolean; game?: InfiniteGame; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("infinite_games")
    .select("*")
    .eq("id", gameId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching infinite game:", error);
    return { success: false, error: error.message };
  }

  return { success: true, game: data as InfiniteGame };
}

export async function saveInfiniteGame(
  gameId: string,
  guesses: Array<{ word: string; statuses: string[] }>,
  status: "playing" | "won" | "lost"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const updateData: any = {
    game_state: {
      guesses,
      status
    },
    updated_at: new Date().toISOString()
  };

  if (status === "won" || status === "lost") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("infinite_games")
    .update(updateData)
    .eq("id", gameId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error saving infinite game:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/infinite");
  return { success: true };
}

export async function deleteInfiniteGame(gameId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("infinite_games")
    .delete()
    .eq("id", gameId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting infinite game:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/infinite");
  return { success: true };
}
