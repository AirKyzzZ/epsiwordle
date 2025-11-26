
const fs = require('fs');
const path = require('path');

const inputPath = path.join(process.cwd(), 'public', 'words.txt');

try {
  const data = fs.readFileSync(inputPath, 'utf8');
  const lines = data.split('\n');

  console.log("Searching for source of ABMAI...");

  for (const line of lines) {
    let word = line.trim();
    if (!word) continue;

    const original = word;
    
    // Mimic the transformation
    word = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    word = word.replace(/[^a-zA-Z]/g, "");
    word = word.toUpperCase();

    if (word === 'ABMAI') {
      console.log(`Found match! Original: "${original}" -> Transformed: "${word}"`);
    }
    if (word === 'ABERR') {
      console.log(`Found match! Original: "${original}" -> Transformed: "${word}"`);
    }
  }

} catch (err) {
  console.error('Error processing file:', err);
}
