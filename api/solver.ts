import { Dictionary, DictionaryTrieNode } from "./dictionary.ts";
import { BOARD_SIZE } from "../common/constants.ts";

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
      const word = step.usedIndices.map((i) => letters[i]).join("");
      validWords.add(word);
    }

    // Find all indices adjacent to our current index.
    const xCoord = step.currIndex % 4;
    const yCoord = Math.floor(step.currIndex / 4);
    const candidateIndices = [];
    if (xCoord > 0) {
      candidateIndices.push(step.currIndex - 1);
    }
    if (xCoord > 0 && yCoord > 0) {
      candidateIndices.push(step.currIndex - BOARD_SIZE - 1);
    }
    if (xCoord > 0 && yCoord < BOARD_SIZE - 1) {
      candidateIndices.push(step.currIndex + BOARD_SIZE - 1);
    }
    if (xCoord < BOARD_SIZE - 1) {
      candidateIndices.push(step.currIndex + 1);
    }
    if (xCoord < BOARD_SIZE - 1 && yCoord > 0) {
      candidateIndices.push(step.currIndex - BOARD_SIZE + 1);
    }
    if (xCoord < BOARD_SIZE - 1 && yCoord < BOARD_SIZE - 1) {
      candidateIndices.push(step.currIndex + BOARD_SIZE + 1);
    }
    if (yCoord > 0) {
      candidateIndices.push(step.currIndex - BOARD_SIZE);
    }
    if (yCoord < BOARD_SIZE - 1) {
      candidateIndices.push(step.currIndex + BOARD_SIZE);
    }

    // For each valid index that hasn't already been used, add it to the steps
    // left to solve if there are candidate words to check in the trie.
    for (const index of candidateIndices) {
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

interface SolveStep {
  currIndex: number;
  usedIndices: number[];
  currNode: DictionaryTrieNode;
}
