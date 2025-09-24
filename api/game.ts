import type { ScoredWord, Token } from "../common/types.ts";

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
