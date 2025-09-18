export default class Dictionary {
  /** The set of all words in the provided english dictionary. */
  words: Set<string>;

  constructor() {
    this.words = new Set();
    const dictionaryText = Deno.readTextFileSync("./api/dictionary.txt");
    for (const word of dictionaryText.split("\n")) {
      this.words.add(word);
    }
    console.log(`Dictionary Loaded. Found ${this.words.size} words.`);
  }

  isWord(word: string) {
    return this.words.has(word);
  }
}
