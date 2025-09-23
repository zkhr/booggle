import type { Player } from "../../common/types.ts";
import { Boo } from "../components/Boo.tsx";
import "./LobbyPage.css";

interface LobbyPageProps {
  onStart: () => void;
  players: Player[];
}

function LobbyPage({ onStart, players }: LobbyPageProps) {
  const renderedPlayers = players.map((player) => PlayerRow(player)).concat();

  return (
    <div className="page lobby">
      <div className="title">
        {players.length} player{players.length > 1 ? "s" : ""} connected
      </div>
      <div className="players">
        {renderedPlayers}
      </div>
      <button className="button" onClick={onStart} type="button">
        Start game
      </button>
    </div>
  );
}

function PlayerRow(player: Player) {
  return (
    <div className="player" data-roster={player.rosterId} key={player.rosterId}>
      <Boo color={player.color} size={40} />
      <div className="nick">{player.nick}</div>
    </div>
  );
}

export default LobbyPage;
