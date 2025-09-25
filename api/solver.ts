import { Dictionary, DictionaryTrieNode } from "./dictionary.ts";

const BOARD_SIZE = 4;

/** A map from an index on the board to its neighboring indices. */
const neighbors = buildNeighborsMap();

export function solve(dictionary: Dictionary, letters: string[]): Set<string> {
  const validWords = new Set<string>();
  const steps: SolveStep[] = [];

  // Add all letters on the board to the list of paths to solve.
  for (let currIndex = 0; currIndex < letters.length; currIndex++) {
    const letter = letters[currIndex];
    const currNode = dictionary.root.children.get(letter);
    if (currNode) {
      const usedIndices = [currIndex];
      steps.push({ currIndex, usedIndices, currNode });
    }
  }

  // For each remaining path, find any additional valid paths we can
  // make from those letters that still have candidate words.
  while (steps.length > 0) {
    const step = steps.pop()!;
    if (step.currNode.isWord) {
      const word = step.usedIndices
        .map((i) => letters[i] === "Q" ? "QU" : letters[i])
        .join("");
      validWords.add(word);
    }

    // For each valid index that hasn't already been used, add it to the steps
    // left to solve if there are candidate words to check in the trie.
    for (const index of neighbors.get(step.currIndex)!) {
      const letter = letters[index];
      const childNode = step.currNode.children.get(letter);
      if (childNode && !step.usedIndices.includes(index)) {
        steps.push({
          currIndex: index,
          usedIndices: [...step.usedIndices, index],
          currNode: childNode,
        });
      }
    }
  }

  return validWords;
}

/** Returns a map from an index on the board to its neighboring indices. */
function buildNeighborsMap(): Map<number, number[]> {
  const neighbors = new Map();

  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    const xCoord = i % BOARD_SIZE;
    const yCoord = Math.floor(i / BOARD_SIZE);
    const indices = [];
    for (let x = xCoord - 1; x <= xCoord + 1; x++) {
      for (let y = yCoord - 1; y <= yCoord + 1; y++) {
        const isValidX = x >= 0 && x < BOARD_SIZE;
        const isValidY = y >= 0 && y < BOARD_SIZE;
        const isSameIndex = x === xCoord && y === yCoord;
        if (isValidX && isValidY && !isSameIndex) {
          indices.push(y * BOARD_SIZE + x);
        }
      }
    }
    neighbors.set(i, indices);
  }

  return neighbors;
}

interface SolveStep {
  currIndex: number;
  usedIndices: number[];
  currNode: DictionaryTrieNode;
}
