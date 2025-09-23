import type { RefObject } from "react";
import type {
  AddPlayerResponse,
  EndGameResults,
  EndResponse,
  GameState,
  JoinResponse,
  RemovePlayerResponse,
  ResponsePacket,
  SendWordResponse,
  StartResponse,
  User,
  Word,
  World,
} from "../common/types.ts";
import type { Updater } from "use-immer";
import {saveCookieValue} from "./cookies.ts";

class ResponsePacketRouter {
  readonly gameStateRef: RefObject<GameState>;
  readonly worldRef: RefObject<World>;
  readonly setWorld: Updater<World>;
  readonly setWords: Updater<Word[]>;
  readonly setResults: Updater<EndGameResults>;
  readonly setUser: Updater<User>;
  readonly setGameState: Updater<GameState>;

  constructor(
    gameStateRef: RefObject<GameState>,
    worldRef: RefObject<World>,
    setWorld: Updater<World>,
    setWords: Updater<Word[]>,
    setResults: Updater<EndGameResults>,
    setUser: Updater<User>,
    setGameState: Updater<GameState>,
  ) {
    this.gameStateRef = gameStateRef;
    this.worldRef = worldRef;
    this.setWorld = setWorld;
    this.setWords = setWords;
    this.setResults = setResults;
    this.setUser = setUser;
    this.setGameState = setGameState;
  }

  route(packet: ResponsePacket) {
    console.log("[packet]", packet);
    if (this.gameStateRef.current === "Login" && packet.action != "join") {
      console.log(`[dropped ${packet.action}]`);
      return;
    }

    switch (packet.action) {
      case "join":
        return this.handleJoin(packet as JoinResponse);
      case "addplayer":
        return this.handleAddPlayer(packet as AddPlayerResponse);
      case "rmplayer":
        return this.handleRemovePlayer(packet as RemovePlayerResponse);
      case "start":
        return this.handleStart(packet as StartResponse);
      case "sendword":
        return this.handleSendWord(packet as SendWordResponse);
      case "end":
        return this.handleEnd(packet as EndResponse);
      default:
        console.log("[err] Invalid message from server.");
    }
  }

  private handleJoin(response: JoinResponse) {
    this.setUser((draft) => {
      draft.nick = response.nick;
      draft.color = response.color;
      draft.token = response.token;
    });
    saveCookieValue("token", response.token);
    saveCookieValue("nick", response.nick);
    saveCookieValue("color", response.color.toString());
    this.setWorld(response.world);
    this.setGameState(response.world.state === "Running" ? "InGame" : "Lobby");
  }

  private handleAddPlayer(response: AddPlayerResponse) {
    if (this.worldRef.current.rosterId === response.rosterId) {
      return;
    }
    this.setWorld((draft) => {
      draft.players.push({
        nick: response.nick,
        color: response.color,
        rosterId: response.rosterId,
      });
    });
  }

  private handleRemovePlayer(response: RemovePlayerResponse) {
    if (this.worldRef.current.rosterId === response.rosterId) {
      return;
    }
    this.setWorld((draft) => {
      draft.players = draft.players.filter((p) =>
        p.rosterId != response.rosterId
      );
    });
  }

  private handleStart(response: StartResponse) {
    this.setWorld((draft) => {
      draft.state = "Running";
      draft.timeElapsed = 0;
      draft.letters = response.letters;
    });
    this.setGameState("InGame");
  }

  private handleSendWord(response: SendWordResponse) {
    this.setWords((draft) => {
      draft.push({ text: response.word, isValid: response.valid });
    });
  }

  private handleEnd(response: EndResponse) {
    this.setResults(response.results);
    this.setWords([]);
    this.setGameState("PostGame");
  }
}

export default ResponsePacketRouter;
