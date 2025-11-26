import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface DailyWord {
  id: string;
  word: string;
  definition: string;
  date: string;
}

// Global cache for dictionary words (persists across module reloads in production)
declare global {
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
    // Use Wiktionary API which is much better for French
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
             // Parse the extract to find the first French definition
             // Structure is usually:
             // == Français ==
             // ...
             // === Nom commun === (or Verbe, Adjectif, etc.)
             // word /pron/ ...
             // 1. Definition...
             
             const frenchSection = extract.split("== Français ==")[1];
             if (frenchSection) {
               // Look for the first line that starts with a number, or just a clean paragraph
               // Definitions often look like "1. (Sens) Description..." or just "Description..." after a type header
               
               // Split by newlines
               const lines = frenchSection.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
               
               for (let i = 0; i < lines.length; i++) {
                 const line = lines[i];
                 // Skip headers (=== ... ===)
                 if (line.startsWith("=")) continue;
                 // Skip pronunciation lines (often contain backslashes or look like "mot \pron\" tags)
                 if (line.includes("\\") && line.includes("masculin")) continue;
                 if (line.includes("\\") && line.includes("féminin")) continue;
                 if (line.includes("\\") && line.includes("verbe")) continue;
                 if (line.startsWith("Étymologie")) continue;
                 
                 // If we found a definition (often starts with just text or a number)
                 // Clean it up
                 return line.replace(/^[0-9]+\.\s*/, ""); // Remove leading "1. "
               }
             }
             
             // Fallback: just return the first 150 chars of the extract if parsing fails
             // but clean up newlines
             return extract.substring(0, 150).replace(/\n/g, " ") + "...";
          }
        }
      }
    }
  } catch (e) {
    console.log("Could not fetch definition from API for:", word, e);
  }
  
  // Fallback definition
  return `Définition non trouvée pour : ${word}`;
}

async function generateDailyWord(): Promise<{ word: string; definition: string }> {
  const supabase = await createClient();
  
  // Use Service Role if available to bypass RLS
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let adminSupabase = supabase;
  
  if (serviceRoleKey) {
    const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
    adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );
  }

  // Get all words already used
  const { data: usedWords } = await adminSupabase
    .from("daily_words")
    .select("word");
  
  const usedWordsSet = new Set((usedWords || []).map((w: any) => w.word.toUpperCase()));
  
  // Load dictionary
  const dictionary = loadDictionary();
  
  if (dictionary.length === 0) {
    throw new Error("Dictionary is empty");
  }
  
  // Filter out already used words
  const availableWords = dictionary.filter(word => !usedWordsSet.has(word));
  
  if (availableWords.length === 0) {
    console.warn("No more unused words in dictionary! All words have been used.");
    // Reset: use all words again
    const randomIndex = Math.floor(Math.random() * dictionary.length);
    const selectedWord = dictionary[randomIndex];
    // Get definition using the accented word
    const definition = await getDefinitionFromAPI(selectedWord);
    
    // When returning, we should probably return the NORMALIZED word for the game component
    // BUT if we want to display the accent in the definition, we return it there.
    // The game component expects a 5-letter word to match against guesses.
    // Standard Wordle uses unaccented uppercase for the grid.
    // So we return: word: "ABIME" (normalized), definition: "Abîme: ..."
    // actually, let's return the normalized word for the 'word' field, but maybe keep the display word in definition?
    
    const normalizedWord = selectedWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    
    // Prepend the display word to definition if needed, or just rely on the definition text
    return { word: normalizedWord, definition: `(${selectedWord}) ${definition}` };
  }
  
  // Pick a random word
  const randomIndex = Math.floor(Math.random() * availableWords.length);
  const selectedWord = availableWords[randomIndex]; // e.g. "ABÎME"
  
  const definition = await getDefinitionFromAPI(selectedWord);
  const normalizedWord = selectedWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase(); // "ABIME"
  
  console.log(`Selected random word: ${selectedWord} -> ${normalizedWord}`);
  
  // Return normalized word for game logic, but definition includes context if needed
  return { word: normalizedWord, definition: `(${selectedWord}) ${definition}` };
}

export async function getDailyWord(): Promise<DailyWord | null> {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // 1. Try to get existing word for today from DB
  let { data, error } = await supabase
    .from("daily_words")
    .select("*")
    .eq("date", today)
    .single();

  // 2. If no word exists for today, generate and save it
  if (!data) {
    console.log("No word for today in DB, generating random word from dictionary...");
    
    try {
      const newWordData = await generateDailyWord();
      
      // Use Service Role if available to bypass RLS
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      let adminSupabase = supabase;
      
      if (serviceRoleKey) {
        const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
        adminSupabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );
      }

      const { data: insertedData, error: insertError } = await adminSupabase
        .from("daily_words")
        .insert({
          word: newWordData.word,
          definition: newWordData.definition,
          date: today
        })
        .select()
        .single();

      if (insertError) {
        // Handle race condition
        if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
          console.log("Word already exists for today (race condition), fetching it...");
          const { data: existingData } = await adminSupabase
            .from("daily_words")
            .select("*")
            .eq("date", today)
            .single();
          
          if (existingData) {
            data = existingData;
          } else {
             // Fallback
            return {
              id: "temp-id-" + Date.now(),
              word: newWordData.word,
              definition: newWordData.definition,
              date: today
            };
          }
        } else {
          console.warn("Could not save generated word to DB:", insertError.message);
           return {
              id: "temp-id-" + Date.now(),
              word: newWordData.word,
              definition: newWordData.definition,
              date: today
          };
        }
      } else {
        data = insertedData;
      }
    } catch (e: any) {
      console.error("Error generating/saving daily word:", e.message);
       // Retry fetch
      const { data: retryData } = await supabase
        .from("daily_words")
        .select("*")
        .eq("date", today)
        .single();
      
      if (retryData) {
        return retryData as DailyWord;
      }
      
      return {
        id: "fallback",
        word: "ERREUR",
        definition: "Une erreur est survenue.",
        date: today
      };
    }
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

  if (error && error.code !== 'PGRST116') { 
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
