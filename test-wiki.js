
async function testWiktionary() {
  const words = ['étage', 'etage', 'côté', 'cote', 'abîme', 'abime'];

  for (const word of words) {
    const url = `https://fr.wiktionary.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(word)}&explaintext=1`;
    console.log(`Fetching ${word}...`);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId === "-1") {
             console.log(`❌ ${word}: Page not found.`);
             continue;
        }
        const content = pages[pageId].extract;
        // Naive extraction of first definition
        // Usually lines starting with special chars or numbers. 
        // In the extract, it's plain text.
        // We look for something that looks like a definition.
        const preview = content ? content.substring(0, 200).replace(/\n/g, ' ') : "No content";
        console.log(`✅ ${word}: Found. Content start: ${preview}`);
      } else {
        console.log(`❌ ${word}: HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`❌ ${word}: Error ${e.message}`);
    }
  }
}

testWiktionary();
