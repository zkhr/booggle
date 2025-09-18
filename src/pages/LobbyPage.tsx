import type { Player } from "../../common/types.ts";

interface LobbyPageProps {
  onStart: () => void;
  players: Player[];
}

function LobbyPage({ onStart, players }: LobbyPageProps) {
  const renderedPlayers = players.map((player) => PlayerRow(player)).concat();

  return (
    <div className="content">
      <div className="title">
        <span className="highlight">{players.length}</span> Player(s) Connected!
      </div>
      <div className="players">
        {renderedPlayers}
      </div>
      <button className="button" onClick={onStart} type="button">Start</button>
    </div>
  );
}

function PlayerRow(player: Player) {
  return (
    <div className="player" data-roster={player.rosterId} key={player.rosterId}>
      <div className={"boo boo-" + player.boo} data-index="16"></div>
      <div className="nick">{player.nick}</div>
    </div>
  );
}

export default LobbyPage;
