import { useEffect } from "react";
import Board from "../Board.tsx";
import type { EndGameResults, Score, ScoredWord } from "../../common/types.ts";
import { GAME_LENGTH_MS } from "../../common/constants.ts";

const BOO_COLORS = [
  [], // no Boo 0
  ["#fdd7d4", "#f43f32"], // Boo 1
  ["#008000", "#00fe00"], // Boo 2
  ["#878700", "#fdfd00"], // Boo 3
  ["#5a0000", "#fa0000"], // Boo 4
  ["#00c3c3", "#00fefe"], // Boo 5
  ["#c78837", "#fcac46"], // Boo 6
  ["#990099", "#fe00fe"], // Boo 7
  ["#000088", "#0000fe"], // Boo 8
  ["#560f77", "#6d1496"], // Boo 9
  ["#254e1e", "#2e6226"], // Boo 10
  ["#3d0000", "#810000"], // Boo 10
  ["#a06e6e", "#feafaf"], // Boo 12
  ["#555555", "#939393"], // Boo 13
  ["#68405b", "#835073"], // Boo 14
  ["#555524", "#93923f"], // Boo 15
  ["#7377b6", "#9398e9"], // Boo 16
];

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
    <div className="endgame content">
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
      <div className={"boo boo-" + score.boo}></div>
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
        <div className={"boo boo-" + score.boo}></div>
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
    const boo = results.scores.filter((s) => s.rosterId == rosterId).map((
      s,
    ) => s.boo)[0];
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvasEl.width,
      canvasEl.height,
    );
    gradient.addColorStop(0, BOO_COLORS[boo][0]);
    gradient.addColorStop(1, BOO_COLORS[boo][1]);
    ctx.strokeStyle = gradient;
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
