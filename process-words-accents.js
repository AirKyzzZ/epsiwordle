
const fs = require('fs');
const path = require('path');

const inputPath = path.join(process.cwd(), 'public', 'words.txt');
const outputPath = path.join(process.cwd(), 'public', 'dictionary.txt');

try {
  // The file is UTF-16 LE
  const data = fs.readFileSync(inputPath, 'utf16le');
  const lines = data.split(/\r?\n/);
  const uniqueWords = new Set();

  console.log(`Total lines in input: ${lines.length}`);

  for (const line of lines) {
    let word = line.trim();
    if (!word) continue;

    // Keep accents this time!
    // Just uppercase it.
    // Note: toUpperCase() in JS handles accents correctly for most Latin chars (e.g. 'é'.toUpperCase() -> 'É')
    let upperWord = word.toUpperCase();
    
    // Check length. But wait, "œ" might count as 1 char in string length but 2 in display?
    // JS string length counts code units. "œ" is 1 char.
    // "É" is 1 char.
    // Let's strictly keep length 5.
    if (upperWord.length === 5) {
        // Filter out words with non-letter chars (spaces, hyphens, numbers)
        if (/^[A-ZÀ-ÖØ-ÞŒ]+$/.test(upperWord)) {
             uniqueWords.add(upperWord);
        }
    }
  }

  const sortedWords = Array.from(uniqueWords).sort((a, b) => a.localeCompare(b, 'fr'));
  fs.writeFileSync(outputPath, sortedWords.join('\n'));

  console.log(`Filtered ${sortedWords.length} unique 5-letter accented words.`);
  console.log(`Saved to ${outputPath}`);
  
} catch (err) {
  console.error('Error processing file:', err);
}
