import { useEffect, useState } from "react";
import Board from "../components/Board.tsx";
import type { Word } from "../../common/types.ts";
import "./GamePage.css";

interface GamePageProps {
  letters: string[];
  words: Word[];
  onWordKeyUp: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  initialTimeElapsed: number;
}

function LobbyPage(
  { letters, words, onWordKeyUp, initialTimeElapsed }: GamePageProps,
) {
  const renderedWords = words.map((word, index) => WordEntry(word, index))
    .reverse().concat();

  const [percentElapsed, setPercentElapsed] = useState(0);

  // Update the page timer every second.
  useEffect(() => {
    const startTime = Date.now() - initialTimeElapsed;
    const gameLengthSeconds = import.meta.env.VITE_GAME_DURATION_SECONDS;
    if (!gameLengthSeconds) {
      return console.error(
        "Missing VITE_GAME_DURATION_SECONDS in booggle env config. Please review https://github.com/zkhr/booggle#prerequisites.",
      );
    }
    const callbackId = setInterval(() => {
      setPercentElapsed(
        100 * (Date.now() - startTime) / (gameLengthSeconds * 1000),
      );
    }, 1000);
    return () => clearInterval(callbackId);
  }, []);

  return (
    <>
      <div className="timer">
        <div
          className="timerInner"
          style={{ width: percentElapsed + "%" }}
        >
        </div>
      </div>
      <div className="game">
        <Board letters={letters} />
        <input
          className="textinput"
          type="text"
          placeholder="add words"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          onKeyUp={onWordKeyUp}
        />
        <div className="paper">{renderedWords}</div>
      </div>
    </>
  );
}

function WordEntry(word: Word, index: number) {
  return (
    <div className={word.isValid ? "word valid" : "word"} key={index}>
      {word.text}
    </div>
  );
}

export default LobbyPage;
