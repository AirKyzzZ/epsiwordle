
async function testBonjour() {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/fr/bonjour`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      console.log("✅ 'bonjour' found.");
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log("❌ 'bonjour' not found.");
    }
  } catch (e) {
    console.log(e);
  }
}
testBonjour();
