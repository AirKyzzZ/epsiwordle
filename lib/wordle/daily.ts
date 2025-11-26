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
          .filter((l: string) => l.length > 0 && l.length < 500); // Filter out very long lines (likely not definitions)
        
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
              line.match(/^[A-ZÀ-ÖØ-ÞŒ]{1,3}$/)) { // Skip single letter abbreviations
            continue;
          }
          
          // Look for definition patterns:
          // 1. Lines starting with numbers (1., 2., etc.)
          // 2. Lines that look like definitions (contain common definition words)
          // 3. Lines that are not too short (at least 10 chars)
          
          if (line.length >= 10) {
            // Clean up the definition
            let definition = line
              .replace(/^[0-9]+[\.\)]\s*/, "") // Remove "1. " or "1) "
              .replace(/^\([^)]+\)\s*/, "") // Remove parenthetical notes at start
              .replace(/\s+/g, " ") // Normalize whitespace
              .trim();
            
            // If it looks like a valid definition (not just metadata)
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
