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
  Theme,
  User,
  Word,
  World,
} from "../common/types.ts";
import ResponsePacketRouter from "./ResponsePacketRouter.ts";
import { Boo, toBooColor, toBooSecondaryColor } from "./components/Boo.tsx";
import { getCookieValue, saveCookieValue } from "./cookies.ts";

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
  const [user, setUser] = useImmer<User>(() => {
    return {
      token: getCookieValue("token", ""),
      nick: getCookieValue("nick", ""),
      color: parseInt(getCookieValue("color", "")),
    };
  });
  const [words, setWords] = useImmer<Word[]>([]);
  const [results, setResults] = useImmer<EndGameResults>({
    letters: [],
    telemetryMap: [],
    allWords: [],
    scores: [],
  });
  const [theme, setTheme] = useImmer<Theme>(() =>
    getCookieValue("theme", "Rainbow") as Theme
  );

  // Add references to values that we read when handling response packets.
  // Note that we can't use the state directly, since it is stale in the
  // useEffect (because we don't add it as a dependency to the useEffect
  // to avoid closing and reopening the websocket over and over).
  //
  // This is a little awkward. Reader, if you know a cleaner solution to
  // this issue, please send me a message.
  const gameStateRef = useRef<GameState>(gameState);
  const worldRef = useRef<World>(world);

  useEffect(() => {
    const style = document.documentElement.style;
    style.setProperty("--primary-color", toBooColor(user.color));
    style.setProperty("--secondary-color", toBooSecondaryColor(user.color));

    // Update the favicon to the user's selected color.
    const faviconSvg = document.querySelector("#favicon-wrapper svg");
    if (faviconSvg) {
      const faviconStr = new XMLSerializer().serializeToString(faviconSvg);
      const href = "data:image/svg+xml;base64," + btoa(faviconStr);
      document.querySelector('link[rel="icon"]')?.setAttribute("href", href);
      document.querySelector('link[rel="apple-touch-icon"]')?.setAttribute(
        "href",
        href,
      );
    }
  }, [user]);

  useEffect(() => {
    document.body.classList.toggle("light-mode", theme === "Light");
    document.body.classList.toggle("dark-mode", theme === "Dark");
    document.body.classList.toggle("rainbow-mode", theme === "Rainbow");
    saveCookieValue("theme", theme);
  }, [theme]);

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
    const socketUrl = import.meta.env.VITE_WEBSOCKET_URL;
    if (!socketUrl) {
      return console.error(
        "Missing VITE_WEBSOCKET_URL in booggle env config. Please review https://github.com/zkhr/booggle#prerequisites.",
      );
    }
    socket.current = new WebSocket(socketUrl);
    socket.current.addEventListener("message", (event) => {
      const packet = JSON.parse(event.data) as ResponsePacket;
      router.route(packet);
    });
  }, []);

  switch (gameState) {
    case "Login":
      return (
        <>
          <LoginPage
            user={user}
            theme={theme}
            onJoin={() => handleJoinButton()}
            onNickChange={(e) => handleNickChange(e)}
            onColorChange={(e) => handleColorChange(e)}
            onThemeChange={(e) => handleThemeChange(e)}
          />
          <div id="favicon-wrapper" style={{ display: "none" }}>
            <Boo color={user.color} size={0} />
          </div>
        </>
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
    send({
      action: "join",
      token: user.token,
      nick: user.nick,
      color: user.color,
    });
  }

  function handleNickChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUser((draft) => {
      draft.nick = e.target.value;
    });
  }

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUser((draft) => {
      draft.color = Math.floor(parseInt(e.target.value));
    });
  }

  function handleThemeChange(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    const button = target.closest(".theme-button") as HTMLButtonElement;
    if (button) {
      setTheme(button.value as Theme);
    }
  }

  function handleStartButton() {
    send({ action: "start" });
  }

  function handleWord(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      const word = e.target.value.trim();
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
    socket.current?.send(message);
  }
}

export default App;
