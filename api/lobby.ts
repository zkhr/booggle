import type {
  GameTelemetryEntry,
  RosterId,
  Token,
  WorldState,
} from "../common/types.ts";
import Dictionary from "./dictionary.ts";
import { getPointsForWord, isReachableWord } from "./game.ts";
import { getRandomLetters } from "./letters.ts";

// Global state, we only have a single in-memory lobby instance for now.
export default class Lobby {
  // State of the game.
  state: WorldState;

  // List of 16 letters
  letters: string[];

  // The start time of the game
  startTime: number;

  // Map from player token to the set of valid words for that player.
  words: Map<Token, string[]>;

  // Scoring data used to render the end game graph of scores over time.
  telemetryMap: Map<RosterId, GameTelemetryEntry[]>;

  // Map from words to the number of players with that word.
  scoringMap: Map<string, number>;

  // The dictionary to use for this lobby.
  dictionary: Dictionary;

  constructor(dictionary: Dictionary) {
    this.state = "Stopped";
    this.letters = [];
    this.startTime = 0;
    this.words = new Map();
    this.telemetryMap = new Map();
    this.scoringMap = new Map();
    this.dictionary = dictionary;
  }

  startGame() {
    this.state = "Running";
    this.letters = getRandomLetters();
    this.startTime = Date.now();
    this.words = new Map();
    this.telemetryMap = new Map();
    this.scoringMap = new Map();
  }

  endGame() {
    this.state = "Stopped";
  }

  handleWord(token: Token, rosterId: RosterId, word: string): boolean {
    if (!this.words.has(token)) {
      this.words.set(token, []);
    }

    const playedWords = this.words.get(token)!;
    const isValid = this.isValidWord(playedWords, word);
    if (isValid) {
      playedWords.push(word);
      const numPlayersWithWord = this.scoringMap.get(word) || 0;
      this.scoringMap.set(word, numPlayersWithWord + 1);
      this.updateTelemetry(rosterId, word);
    }
    return isValid;
  }

  isValidWord(playedWords: string[], word: string) {
    return (
      word.length >= 3 &&
      playedWords.indexOf(word) < 0 &&
      this.dictionary.isWord(word) &&
      isReachableWord(word, this.letters)
    );
  }

  updateTelemetry(rosterId: RosterId, word: string) {
    if (!this.telemetryMap.has(rosterId)) {
      this.telemetryMap.set(rosterId, []);
    }
    const entries = this.telemetryMap.get(rosterId)!;

    const prevScore = entries.length > 0 ? entries[entries.length - 1][1] : 0;
    const currScore = prevScore + getPointsForWord(word);
    const timeElapsed = Date.now() - this.startTime;
    entries.push([timeElapsed, currScore]);
  }
}
