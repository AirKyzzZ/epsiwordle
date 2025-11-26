-- Cleanup old hardcoded daily words
-- This migration removes the old hardcoded words from the initial schema
-- The system in lib/wordle/daily.ts will now generate words dynamically from the dictionary file

-- List of old hardcoded words to remove
-- These are the words that were inserted in the initial migration
-- We'll delete them regardless of game attempts, as the new system will generate better words

DELETE FROM public.daily_words
WHERE word IN (
  'REACT', 'ALGO', 'CACHE', 'DEBUG', 'LINUX', 'CLOUD', 'PIXEL', 'PROXY', 
  'TOKEN', 'AGILE', 'JAVA', 'HTML', 'CODE', 'DATA', 'NODE', 'SASS', 
  'WIFI', 'BUG', 'API', 'GIT', 'JSON', 'RUBY', 'SHELL', 'STACK', 
  'VIEW', 'BYTE', 'PING', 'LOOP', 'ARRAY', 'CLASS', 'FRAME', 'LOGIN'
);

-- Note: This will also delete associated game_attempts due to CASCADE delete
-- If you want to preserve game history, you can modify the foreign key constraint
-- or use a different approach. For now, we're doing a clean slate.

-- The system in lib/wordle/daily.ts will automatically generate new words
-- from the dictionary file (dictionnary.dic) when getDailyWord() is called
-- and no word exists for the current date. It will:
-- 1. Load words from public/dictionnary.dic
-- 2. Filter out already used words
-- 3. Pick a random word from available words
-- 4. Fetch definition from API (api.dictionaryapi.dev)
-- 5. Save to database with the current date
