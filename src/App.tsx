import React, { useEffect, useRef } from "react";
import { useImmer } from "use-immer";
import "./App.css";
import LoginPage from "./pages/LoginPage.tsx";
import LobbyPage from "./pages/LobbyPage.tsx";
import GamePage from "./pages/GamePage.tsx";
import PostGamePage from "./pages/PostGamePage.tsx";
import type {
  EndGameResults,
  GameState,
  RequestPacket,
  ResponsePacket,
  User,
  Word,
  World,
} from "../common/types.ts";
import ResponsePacketRouter from "./ResponsePacketRouter.ts";

function App() {
  const socket = useRef<WebSocket | null>(null);

  const [gameState, setGameState] = useImmer<GameState>("Login");
  const [world, setWorld] = useImmer<World>({
    state: "Stopped",
    players: [],
    letters: [],
    timeElapsed: 0,
    rosterId: "",
  });
  const [user, setUser] = useImmer<User>(() => loadUser());
  const [words, setWords] = useImmer<Word[]>([]);
  const [results, setResults] = useImmer<EndGameResults>({
    letters: [],
    telemetryMap: [],
    scores: [],
  });

  // Add references to values that we read when handling response packets.
  // Note that we can't use the state directly, since it is stale in the
  // useEffect (because we don't add it as a dependency to the useEffect
  // to avoid closing and reopening the websocket over and over).
  //
  // This is a little awkward. Reader, if you know a cleaner solution to
  // this issue, please send me a message.
  const gameStateRef = useRef<GameState>(gameState);
  const worldRef = useRef<World>(world);

  /** Loads the initial player data from the user's cookies. */
  function loadUser(): User {
    const user: User = { boo: 1, nick: "", token: "" };
    const parts = document.cookie.split("; ");
    for (const part of parts) {
      const [key, value] = part.split("=");
      switch (key) {
        case "token":
          user.token = value;
          break;
        case "nick":
          user.nick = value;
          break;
        case "boo":
          user.boo = parseInt(value);
          break;
      }
    }
    return user;
  }

  useEffect(() => {
    gameStateRef.current = gameState;
    worldRef.current = world;
  }, [gameState, world]);
  useEffect(() => {
    if (socket.current !== null) {
      return;
    }
    const router = new ResponsePacketRouter(
      gameStateRef,
      worldRef,
      setWorld,
      setWords,
      setResults,
      setUser,
      setGameState,
    );
    // do not submit
    // socket.current = new WebSocket("wss://ari.blumenthal.dev:9001");
    socket.current = new WebSocket("ws://localhost:9001");
    socket.current.addEventListener("message", (event) => {
      const packet = JSON.parse(event.data) as ResponsePacket;
      router.route(packet);
    });
  }, []);

  switch (gameState) {
    case "Login":
      return (
        <LoginPage
          user={user}
          onJoin={() => handleJoinButton()}
          onNickChange={(e) => handleNickChange(e)}
          onBooChange={(e) => handleBooChange(e)}
        />
      );
    case "Lobby":
      return (
        <LobbyPage
          onStart={() => handleStartButton()}
          players={world.players}
        />
      );
    case "InGame":
      return (
        <GamePage
          letters={world.letters}
          words={words}
          onWordKeyUp={(e) => handleWord(e)}
          initialTimeElapsed={world.timeElapsed}
        />
      );
    case "PostGame":
      return (
        <PostGamePage
          results={results}
          onClose={() => handleCloseButton()}
        />
      );
  }

  function handleJoinButton() {
    send({ action: "join", token: user.token, nick: user.nick, boo: user.boo });
  }

  function handleNickChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUser((draft) => {
      draft.nick = e.target.value;
    });
  }

  function handleBooChange(e: React.MouseEvent) {
    setUser((draft) => {
      if (e.target instanceof HTMLElement) {
        const index = parseInt(e.target.dataset.index || "");
        if (index > 0) {
          draft.boo = index;
        }
      }
    });
  }

  function handleStartButton() {
    send({ action: "start" });
  }

  function handleWord(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      const word = e.target.value;
      e.target.value = "";
      send({ action: "sendword", token: user.token, word });
    }
  }

  function handleCloseButton() {
    setGameState("Lobby");
  }

  /** Sends a packet to the server via the websocket. */
  function send(packet: RequestPacket) {
    const message = JSON.stringify(packet);
    console.log("sending", message);
    socket.current?.send(message);
  }
}

export default App;
