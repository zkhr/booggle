import type { ScoredWord, Token } from "../common/types.ts";

const BOARD_SIZE = 4;

/** A score for a player, keyed by their internal token. */
interface ComputedScore {
  token: Token;
  words: ScoredWord[];
  points: number;
}

export function buildGameResults(
  words: Map<Token, string[]>,
  scoringMap: Map<string, number>,
): ComputedScore[] {
  const scores = [];
  const pointsList = scorePoints(words);
  for (const [token, points] of pointsList) {
    const playerWords = words.get(token)!.sort();
    const wordsWithMetadata = [];
    for (const word of playerWords) {
      wordsWithMetadata.push({ word, unique: scoringMap.get(word) === 1 });
    }
    scores.push({ token, words: wordsWithMetadata, points });
  }
  return scores;
}

function scorePoints(words: Map<Token, string[]>) {
  const pointsList: [Token, number][] = [];
  for (const [token, playerWords] of words.entries()) {
    let points = 0;
    for (const word of playerWords) {
      points += getPointsForWord(word);
    }
    pointsList.push([token, points]);
  }
  return pointsList.sort((a, b) => b[1] - a[1]);
}

export function getPointsForWord(word: string) {
  switch (word.length) {
    case 3:
    case 4:
      return 1;
    case 5:
      return 2;
    case 6:
      return 3;
    case 7:
      return 5;
    default:
      return 11;
  }
}

export function isReachableWord(word: string, letters: string[]) {
  word = word.toUpperCase();

  // Possible paths is an array of paths. Each path is an array of indices in
  // letters.
  let possiblePaths: number[][] = [];
  let prevLetter: string = word[0];

  // Find the locations on the board with the first letter of the word.
  for (let i = 0; i < letters.length; i++) {
    if (letters[i] == word[0]) {
      possiblePaths.push([i]);
    }
  }

  // Then, one letter at a time, find any valid paths continuing from the
  // previous paths found in the last iteration of the loop.
  for (let i = 1; i < word.length; i++) {
    if (prevLetter == "Q") {
      prevLetter = word[i];
      continue;
    }
    const newPaths: number[][] = [];
    for (const path of possiblePaths) {
      const lastIndex = path[path.length - 1];
      const xCoord = lastIndex % 4;
      const yCoord = Math.floor(lastIndex / 4);
      const validIndices = [];
      if (xCoord > 0) {
        validIndices.push(lastIndex - 1);
      }
      if (xCoord > 0 && yCoord > 0) {
        validIndices.push(lastIndex - BOARD_SIZE - 1);
      }
      if (xCoord > 0 && yCoord < BOARD_SIZE - 1) {
        validIndices.push(lastIndex + BOARD_SIZE - 1);
      }
      if (xCoord < BOARD_SIZE - 1) {
        validIndices.push(lastIndex + 1);
      }
      if (xCoord < BOARD_SIZE - 1 && yCoord > 0) {
        validIndices.push(lastIndex - BOARD_SIZE + 1);
      }
      if (xCoord < BOARD_SIZE - 1 && yCoord < BOARD_SIZE - 1) {
        validIndices.push(lastIndex + BOARD_SIZE + 1);
      }
      if (yCoord > 0) {
        validIndices.push(lastIndex - BOARD_SIZE);
      }
      if (yCoord < BOARD_SIZE - 1) {
        validIndices.push(lastIndex + BOARD_SIZE);
      }
      for (const index of validIndices) {
        if (
          index >= 0 &&
          index < BOARD_SIZE * BOARD_SIZE &&
          letters[index] == word[i] &&
          path.indexOf(index) < 0
        ) {
          newPaths.push([...path, index]);
        }
      }
    }
    if (!newPaths.length) {
      return false;
    }
    possiblePaths = newPaths;
    prevLetter = word[i];
  }
  return true;
}
