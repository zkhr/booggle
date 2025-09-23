import { useEffect } from "react";
import Board from "../Board.tsx";
import type { EndGameResults, Score, ScoredWord } from "../../common/types.ts";
import { GAME_LENGTH_MS } from "../../common/constants.ts";
import { Boo, toBooColor } from "../Boo.tsx";
import "./PostGamePage.css";

interface PostGamePageProps {
  results: EndGameResults;
  onClose: () => void;
}

function PostGamePage({ results, onClose }: PostGamePageProps) {
  const winner = results.scores[0]?.nick || "";
  const renderedScores = results.scores.map((s) => renderScore(s)).concat();
  const renderedCards = results.scores.map((s) => renderScoreCard(s)).concat();

  useEffect(() => {
    updateTelemetry(results);
  }, []);

  return (
    <div className="endgame page">
      <div className="title">
        <span className="highlight">{winner}</span> Wins!
      </div>
      {renderedScores}
      {renderedCards}
      <div className="multirow">
        <div id="canvascard" className="card canvascard">
          <canvas id="canvas" height="168"></canvas>
        </div>
        <Board letters={results.letters} />
      </div>
      <button className="button" onClick={onClose} type="button">Close</button>
    </div>
  );
}

function renderScore(score: Score) {
  return (
    <div className="rank" key={score.rosterId}>
      <Boo color={score.color} size={40} />
      <div className="nick">{score.nick}</div>
      <div className="points">{score.points} pts</div>
    </div>
  );
}

function renderScoreCard(score: Score) {
  const renderedWords = score.words.map((w, i) => renderWord(w, i)).concat();
  return (
    <div className="card" key={score.rosterId}>
      <div className="toprow">
        <Boo color={score.color} size={40} />
        <div className="nick">{score.nick}</div>
      </div>
      <div className="scored-words">
        {renderedWords}
      </div>
    </div>
  );
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
  const canvasCardEl = document.getElementById("canvascard") as HTMLDivElement;
  if (!canvasEl) {
    return;
  }

  canvasEl.width = canvasCardEl.clientWidth;

  const ctx = canvasEl.getContext("2d");
  if (!ctx) {
    return;
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

      x = (msSinceStart / GAME_LENGTH_MS) * canvasEl.width;
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

export default PostGamePage;
