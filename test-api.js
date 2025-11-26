
async function testDefinitions() {
  const words = ['abime', 'abîme', 'cote', 'côté', 'etage', 'étage'];

  for (const word of words) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/fr/${encodeURIComponent(word)}`;
    console.log(`Fetching ${word}...`);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
        console.log(`✅ ${word}: Found. Def: ${def?.substring(0, 50)}...`);
      } else {
        console.log(`❌ ${word}: Not found (${res.status})`);
      }
    } catch (e) {
      console.log(`❌ ${word}: Error ${e.message}`);
    }
  }
}

testDefinitions();
