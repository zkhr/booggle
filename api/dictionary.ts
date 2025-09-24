export class Dictionary {
  root: DictionaryTrieNode;

  constructor() {
    this.root = new DictionaryTrieNode();

    const dictionaryText = Deno.readTextFileSync("./api/dictionary.txt");
    for (const word of dictionaryText.split("\n")) {
      let currNode = this.root;
      for (const letter of word) {
        currNode = currNode.getOrCreateChildNode(letter);
      }
      currNode.isWord = true;
    }
  }
}

export class DictionaryTrieNode {
  /**
   * A map from the next upper case letter in the word to the node for that
   * letter. If no node is found, there are no dictionary words that match.
   */
  children: Map<string, DictionaryTrieNode>;

  /** Whether the sequence of letters that reached this node is a valid word. */
  isWord: boolean;

  constructor() {
    this.children = new Map();
    this.isWord = false;
  }

  /**
   * Returns the child node for the provided letter, or creates a new one if not
   * found.
   */
  getOrCreateChildNode(letter: string): DictionaryTrieNode {
    let node = this.children.get(letter);
    if (!node) {
      node = new DictionaryTrieNode();
      this.children.set(letter, node);
    }
    return node;
  }
}
