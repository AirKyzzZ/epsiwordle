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

// Cache for dictionary words
let dictionaryWords: string[] | null = null;

function loadDictionary(): string[] {
  if (dictionaryWords) {
    return dictionaryWords;
  }

  try {
    const filePath = join(process.cwd(), "public", "dictionnary.dic");
    
    if (!existsSync(filePath)) {
      console.error(`Dictionary file not found at: ${filePath}`);
      return [];
    }

    console.log(`Loading dictionary from: ${filePath}`);
    const fileContent = readFileSync(filePath, "utf-8");
    const words: string[] = [];

    // Parse the .dic file format
    const lines = fileContent.split("\n");
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
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
      if (/^[A-Z]+$/.test(normalizedWord) && normalizedWord.length >= 4 && normalizedWord.length <= 10) {
        // Avoid duplicates
        if (!words.includes(normalizedWord)) {
          words.push(normalizedWord);
        }
      }
    }

    dictionaryWords = words;
    console.log(`✓ Loaded ${words.length} words from dictionary`);
    return words;
  } catch (error: any) {
    console.error("Error loading dictionary:", error.message);
    return [];
  }
}

async function getDefinitionFromAPI(word: string): Promise<string> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/fr/${encodeURIComponent(word.toLowerCase())}`, {
      signal: AbortSignal.timeout(3000),
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const firstEntry = data[0];
        if (firstEntry.meanings && firstEntry.meanings.length > 0) {
          const firstMeaning = firstEntry.meanings[0];
          if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
            return firstMeaning.definitions[0].definition || `Mot français : ${word}`;
          }
        }
      }
    }
  } catch (e) {
    console.log("Could not fetch definition from API for:", word);
  }
  
  // Fallback definition
  return `Mot français : ${word}`;
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
    // Reset: use all words again (or handle this case differently)
    // For now, we'll use a random word from the full dictionary
    const randomIndex = Math.floor(Math.random() * dictionary.length);
    const selectedWord = dictionary[randomIndex];
    const definition = await getDefinitionFromAPI(selectedWord);
    return { word: selectedWord, definition };
  }
  
  // Pick a random word from available words
  const randomIndex = Math.floor(Math.random() * availableWords.length);
  const selectedWord = availableWords[randomIndex];
  
  // Get definition from API or use fallback
  const definition = await getDefinitionFromAPI(selectedWord);
  
  console.log(`Selected random word: ${selectedWord} (${availableWords.length} words remaining)`);
  
  return { word: selectedWord, definition };
}

export async function getDailyWord(): Promise<DailyWord | null> {
  const supabase = await createClient();
  // Use UTC date to ensure consistency across timezones
  // Or use Europe/Paris timezone for French users
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
        // Handle race condition: if another request already inserted a word for today
        // (unique constraint on 'date'), retry fetching it
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
            console.warn("Could not fetch word after race condition");
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
      // Try one more time to fetch existing word (in case it was created by another request)
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
        definition: "Une erreur est survenue lors de la génération du mot.",
        date: today
      };
    }
  }

  // Confirm: All users calling this function on the same date will get the same word
  // The word changes at midnight (00:00) when the date changes
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
