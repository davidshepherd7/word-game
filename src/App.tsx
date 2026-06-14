import { useCallback, useEffect, useState } from 'react';
import { type Letter } from './logic/board.ts';
import { Game, generateGame } from './logic/game.ts';
import { Player } from './logic/player.ts';
import { isWord, loadDictionary, solve, type FoundWord } from './logic/word-checker.ts';
import { storage } from './storage/storage.ts';
import { AllWords } from './ui/AllWords.tsx';
import { BoardView } from './ui/BoardView.tsx';
import { FoundWords } from './ui/FoundWords.tsx';
import { PlayerScreen } from './ui/PlayerScreen.tsx';
import './App.css';

// Debug mode is hidden from normal players but reachable on any build (including
// production) by visiting with `?debug=1`. The choice latches into localStorage so
// it survives later navigation; `?debug=0` turns it back off. Not a security
// boundary — just keeps the debug controls out of the way of real players.
function debugEnabled(): boolean {
  let param: string | null = null;
  try {
    param = new URLSearchParams(window.location.search).get('debug');
  } catch {
    return false;
  }
  if (param !== null) {
    const on = param !== '0' && param !== 'false';
    try {
      localStorage.setItem('wordgame:debug', on ? '1' : '0');
    } catch {
      // Ignore: localStorage may be unavailable (private mode / quota).
    }
    return on;
  }
  try {
    return localStorage.getItem('wordgame:debug') === '1';
  } catch {
    return false;
  }
}

function newGame(): Game {
  const game = generateGame();
  // Persist the fresh board immediately so a reload before the first word
  // restores this board rather than generating a different one.
  storage.saveGame({ board: game.board, words: [], winCondition: game.winCondition });
  return game;
}

function loadSavedGame(): Game | null {
  // Decoding the saved words re-runs isWord, so the dictionary must already be
  // loaded by the time this is called.
  const saved = storage.loadGame();
  if (!saved) return null;
  const game = new Game(saved.board, solve(saved.board), saved.winCondition);
  saved.words.forEach((word) => game.addWord(word));
  return game;
}

function App() {
  // Null until the dictionary has loaded.
  const [player, setPlayer] = useState<Player | null>(null);
  // Null on the home screen; a Game while one is in progress.
  const [game, setGame] = useState<Game | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  // Experience just won, while the victory animation plays before going home.
  const [victoryExp, setVictoryExp] = useState<number | null>(null);
  // Game mutates in place, so bump a counter to re-render after it changes.
  const [, setTick] = useState(0);
  const [solution, setSolution] = useState<readonly FoundWord[] | null>(null);
  const [debug] = useState(debugEnabled);

  useEffect(() => {
    loadDictionary()
      .then(() => {
        setPlayer(storage.loadPlayer() ?? new Player());
        setHasSavedGame(storage.loadGame() != null);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (victoryExp == null) return;
    const timer = setTimeout(() => {
      setVictoryExp(null);
      setGame(null);
    }, 1800);
    return () => clearTimeout(timer);
  }, [victoryExp]);

  const handleWin = useCallback(() => {
    if (!game || !player) return;
    const exp = game.winCondition.expAwarded();
    player.gainExperience(exp);
    storage.savePlayer(player);
    storage.clearGame();
    setHasSavedGame(false);
    setSolution(null);
    setVictoryExp(exp);
  }, [game, player]);

  const addWord = useCallback(
    (letters: readonly Letter[]) => {
      if (!game || !player) return;
      const found = isWord(letters);
      if (!found) return;
      game.addWord(found);

      if (game.hasWon()) {
        handleWin();
        return;
      }

      storage.saveGame({
        board: game.board,
        words: game.words(),
        winCondition: game.winCondition,
      });
      setTick((tick) => tick + 1);
    },
    [game, player, handleWin],
  );

  const winGame = useCallback(() => {
    if (!game) return;
    game.solution.forEach((word) => game.addWord(word));
    if (game.hasWon()) handleWin();
  }, [game, handleWin]);

  const startNewGame = useCallback(() => {
    setGame(newGame());
    setSolution(null);
  }, []);

  const resumeGame = useCallback(() => {
    setGame(loadSavedGame());
    setSolution(null);
  }, []);

  const giveUp = useCallback(() => {
    storage.clearGame();
    setHasSavedGame(false);
    setGame(null);
    setSolution(null);
  }, []);

  const toggleSolution = useCallback(() => {
    if (!game) return;
    setSolution((current) => (current ? null : solve(game.board)));
  }, [game]);

  const clearStorage = useCallback(() => {
    storage.clearGame();
    storage.clearPlayer();
    setPlayer(new Player());
    setHasSavedGame(false);
  }, []);

  if (!player) {
    return (
      <main className="game">
        <h1>Word Game</h1>
        <p className="score">Loading dictionary…</p>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="game">
        <h1>Word Game</h1>
        <PlayerScreen
          player={player}
          onNewGame={startNewGame}
          onResume={hasSavedGame ? resumeGame : undefined}
        />
        {debug && (
          <section className="debug">
            <h2>Debug</h2>
            <div className="controls">
              <button type="button" className="control-button" onClick={clearStorage}>
                Clear storage
              </button>
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="game">
      <h1>Word Game</h1>
      <button type="button" className="control-button" onClick={giveUp}>
        Give up
      </button>
      <div className="play-area">
        <aside className="sidebar">
          <p className="score">{game.status()}</p>
          <FoundWords words={game.words()} />
        </aside>
        <BoardView board={game.board} onWord={addWord} />
      </div>
      {debug && (
        <section className="debug">
          <h2>Debug</h2>
          <div className="controls">
            <button type="button" className="control-button" onClick={toggleSolution}>
              {solution ? 'Hide all words' : 'Show all words'}
            </button>
            <button type="button" className="control-button" onClick={winGame}>
              Win game
            </button>
            <button type="button" className="control-button" onClick={clearStorage}>
              Clear storage
            </button>
          </div>
          {solution && <AllWords words={solution} />}
        </section>
      )}
      {victoryExp != null && (
        <div className="victory-overlay" role="alert">
          <div className="victory-card">
            <p className="victory-title">You win! 🎉</p>
            <p className="victory-exp">+{victoryExp} XP</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
