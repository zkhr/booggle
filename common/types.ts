/** The current user's private token. This is _not_ shared with other players. */
export type Token = string;

/** A user's public rosterId. This _is_ shared with other players. */
export type RosterId = string;

export type RequestPacket = JoinRequest | StartRequest | SendWordRequest;

export type ResponsePacket =
  | JoinResponse
  | AddPlayerResponse
  | RemovePlayerResponse
  | StartResponse
  | SendWordResponse
  | EndResponse;

export interface JoinRequest {
  action: "join";
  token: Token;
  nick: string;
  color: number; 
}

export interface JoinResponse {
  action: "join";
  token: Token;
  nick: string;
  color: number; 
  world: World;
}

export interface AddPlayerResponse {
  action: "addplayer";
  rosterId: RosterId;
  nick: string;
  color: number; 
}

export interface RemovePlayerResponse {
  action: "rmplayer";
  rosterId: RosterId;
}

export interface StartRequest {
  action: "start";
}

export interface StartResponse {
  action: "start";
  letters: string[];
}

export interface SendWordRequest {
  action: "sendword";
  token: Token;
  word: string;
}

export interface SendWordResponse {
  action: "sendword";
  word: string;
  valid: boolean;
}

export interface EndResponse {
  action: "end";
  results: EndGameResults;
}

export interface EndGameResults {
  letters: string[];
  telemetryMap: [string, GameTelemetryEntry[]][];
  scores: Score[];
}

/**
 * An entry in the scoring data. Each entry containins the time since the
 * start of the round (in ms) and the updated score at that time.
 */
export type GameTelemetryEntry = [number, number];

export interface Score {
  nick: string;
  color: number; 
  rosterId: RosterId;
  words: ScoredWord[];
  points: number;
}

export interface ScoredWord {
  word: string;
  unique: boolean;
}

export interface World {
  state: WorldState;
  players: Player[];
  letters: string[];
  timeElapsed: number;
  rosterId: RosterId;
}

export type WorldState = "Stopped" | "Running";

export type GameState = "Login" | "Lobby" | "InGame" | "PostGame";

export interface Player {
  nick: string;
  color: number; 
  rosterId: RosterId;
}

export interface User {
  nick: string;
  color: number; 
  token: Token;
}

export interface Word {
  text: string;
  isValid: boolean;
}
