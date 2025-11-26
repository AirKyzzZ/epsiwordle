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
  try {
    const response = await fetch(`https://fr.wiktionary.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(word)}&explaintext=1&redirects=1`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'WordleFr/1.0 (education project)' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const pages = data.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId !== "-1") {
          const extract = pages[pageId].extract;
          if (extract) {
            const frenchSection = extract.split("== Français ==")[1];
            if (frenchSection) {
              const lines = frenchSection.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith("=")) continue;
                if (line.includes("\\") && (line.includes("masculin") || line.includes("féminin") || line.includes("verbe"))) continue;
                if (line.startsWith("Étymologie")) continue;
                
                return line.replace(/^[0-9]+\.\s*/, "");
              }
            }
            
            return extract.substring(0, 150).replace(/\n/g, " ") + "...";
          }
        }
      }
    }
  } catch (e) {
    console.log("Could not fetch definition from API for:", word, e);
  }
  
  return `Définition non trouvée pour : ${word}`;
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
