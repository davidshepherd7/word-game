import type { Player } from '../logic/player.ts';

export function PlayerScreen({
  player,
  onNewGame,
  onResume,
}: {
  player: Player;
  onNewGame: () => void;
  onResume?: () => void;
}) {
  const { into, needed } = player.levelProgress();
  const percent = Math.round(player.progressToNextLevel() * 100);
  const label = needed === null ? `${into} XP` : `${into} / ${needed} XP`;

  return (
    <section className="player-screen">
      <p className="player-level">Level {player.level()}</p>
      <div
        className="exp-bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="exp-bar-fill" style={{ width: `${percent}%` }} />
        <span className="exp-bar-label">{label}</span>
      </div>
      {onResume && (
        <button type="button" className="control-button" onClick={onResume}>
          Resume game
        </button>
      )}
      <button type="button" className="control-button" onClick={onNewGame}>
        New game
      </button>
    </section>
  );
}
