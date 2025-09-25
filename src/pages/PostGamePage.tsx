import { useEffect } from "react";
import { useImmer } from "use-immer";
import Board from "../components/Board.tsx";
import type { EndGameResults, Score, ScoredWord } from "../../common/types.ts";
import { Boo, toBooColor } from "../components/Boo.tsx";
import "./PostGamePage.css";

interface PostGamePageProps {
  results: EndGameResults;
  onClose: () => void;
}

function PostGamePage({ results, onClose }: PostGamePageProps) {
  const winner = results.scores[0];
  const renderedScores = results.scores.map((s) => renderScore(s)).concat();
  const renderedCards = results.scores.map((s) => renderScoreCard(s)).concat();

  const [showOtherWords, setShowOtherWords] = useImmer(false);

  useEffect(() => {
    updateTelemetry(results);
  }, []);

  return (
    <div className="endgame page">
      <div className="title">{winner.nick} wins!</div>
      <div className="entries">
        {renderedScores}
        {renderedCards}
        {renderAllWordsCard(results.allWords)}
        <div className="multirow">
          <div id="canvascard" className="card canvascard">
            <canvas id="canvas" height="168"></canvas>
          </div>
          <Board letters={results.letters} />
        </div>
        <div>
          <button className="button" onClick={onClose} type="button">
            Close results
          </button>
        </div>
      </div>
    </div>
  );

  function renderScore(score: Score) {
    return (
      <div className="rank" key={score.rosterId}>
        <Boo color={score.color} size={30} />
        <div className="nick">{score.nick}</div>
        <div className="points">{score.points} pts</div>
      </div>
    );
  }

  function renderScoreCard(score: Score) {
    const renderedWords = score.words.map((w, i) => renderWord(w, i)).concat();
    return (
      <div className="card" key={score.rosterId}>
        <div
          className="toprow"
          style={{ "background": toBooColor(score.color) }}
        >
          {score.nick}
        </div>
        <div className="scored-words">
          {renderedWords}
        </div>
      </div>
    );
  }

  function renderAllWordsCard(allWords: ScoredWord[]) {
    const renderedWords = allWords
      .filter((w) => w.unique)
      .sort((a, b) => a.word.localeCompare(b.word))
      .map((w, i) => renderWord(w, i)).concat();
    return (
      <div className="card" key="all-words">
        <div className="toprow all-words" onClick={toggleAllWords}>
          other possible words
          <div>
            {showOtherWords ? "▾" : "▸"}
          </div>
        </div>
        <div className={"words-wrapper" + (showOtherWords ? "" : " hidden")}>
          <div>
            <div className="scored-words">
              {renderedWords}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function toggleAllWords() {
    setShowOtherWords(!showOtherWords);
  }

  function renderWord(scoredWord: ScoredWord, index: number) {
    return (
      <span className={scoredWord.unique ? "unique" : ""} key={index}>
        {scoredWord.word}
      </span>
    );
  }

  function updateTelemetry(results: EndGameResults) {
    const canvasEl = document.getElementById("canvas") as HTMLCanvasElement;
    const canvasCardEl = document.getElementById(
      "canvascard",
    ) as HTMLDivElement;
    if (!canvasEl) {
      return;
    }

    canvasEl.width = canvasCardEl.clientWidth;

    const ctx = canvasEl.getContext("2d");
    if (!ctx) {
      return;
    }

    const gameLengthSeconds = import.meta.env.VITE_GAME_DURATION_SECONDS;
    if (!gameLengthSeconds) {
      return console.error(
        "Missing VITE_GAME_DURATION_SECONDS in booggle env config. Please review https://github.com/zkhr/booggle#prerequisites.",
      );
    }

    const maxScore = results.scores[0].points;

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    for (const [rosterId, pairs] of results.telemetryMap) {
      const color = results.scores.filter((s) => s.rosterId == rosterId).map((
        s,
      ) => s.color)[0];
      ctx.strokeStyle = toBooColor(color);
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(0, canvasEl.height);

      let x, y;
      for (let i = 0; i < pairs.length; i++) {
        const msSinceStart = pairs[i][0];
        const score = pairs[i][1];

        x = (msSinceStart / (gameLengthSeconds * 1000)) * canvasEl.width;
        // boo is 40 px, max score ends at half of boo height
        y = canvasEl.height - ((score / maxScore) * (canvasEl.height - 20));
        // Straddle pixels to make look less bad
        ctx.lineTo(x + 0.5, y + 0.5);
      }

      if (y) {
        ctx.lineTo(canvasEl.width, y);
        ctx.stroke();
      }
    }
  }
}

export default PostGamePage;
