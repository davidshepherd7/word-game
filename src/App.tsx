import { useCallback, useEffect, useState } from 'react';
import { generateBoard, type Letter } from './logic/board.ts';
import { Game } from './logic/game.ts';
import { randomWinCondition } from './logic/win-condition.ts';
import { isWord, loadDictionary, solve, type FoundWord } from './logic/word-checker.ts';
import { storage } from './storage/storage.ts';
import { AllWords } from './ui/AllWords.tsx';
import { BoardView } from './ui/BoardView.tsx';
import { FoundWords } from './ui/FoundWords.tsx';
import './App.css';

function newGame(): Game {
  // TODO: we should probably check that the board is winnable
  const game = new Game(generateBoard(4), randomWinCondition());
  // Persist the fresh board immediately so a reload before the first word
  // restores this board rather than generating a different one.
  storage.saveGame({ board: game.board, words: [], winCondition: game.winCondition });
  return game;
}

function restoreGame(): Game {
  // Decoding the saved words re-runs isWord, so the dictionary must already be
  // loaded by the time this is called.
  const saved = storage.loadGame();
  if (!saved) return newGame();
  const game = new Game(saved.board, saved.winCondition);
  saved.words.forEach((word) => game.addWord(word));
  return game;
}

function App() {
  // Null until the dictionary has loaded and the game has been restored.
  const [game, setGame] = useState<Game | null>(null);
  // Game mutates in place, so bump a counter to re-render after it changes.
  const [, setTick] = useState(0);
  const [solution, setSolution] = useState<readonly FoundWord[] | null>(null);

  useEffect(() => {
    loadDictionary()
      .then(() => setGame(restoreGame()))
      .catch((error) => console.error(error));
  }, []);

  const addWord = useCallback(
    (letters: readonly Letter[]) => {
      if (!game) return;
      const found = isWord(letters);
      if (!found) return;
      game.addWord(found);
      storage.saveGame({
        board: game.board,
        words: game.words(),
        winCondition: game.winCondition,
      });
      setTick((tick) => tick + 1);
    },
    [game],
  );

  const startNewGame = useCallback(() => {
    setGame(newGame());
    setSolution(null);
  }, []);

  const toggleSolution = useCallback(() => {
    if (!game) return;
    setSolution((current) => (current ? null : solve(game.board)));
  }, [game]);

  const clearStorage = useCallback(() => {
    storage.clearGame();
  }, []);

  if (!game) {
    return (
      <main className="game">
        <h1>Word Game</h1>
        <p className="score">Loading dictionary…</p>
      </main>
    );
  }

  const won = game.hasWon();

  return (
    <main className="game">
      <h1>Word Game</h1>
      <button type="button" className="control-button" onClick={startNewGame}>
        New game
      </button>
      <div className="play-area">
        <aside className="sidebar">
          <p className="score">{game.status()}</p>
          {won && <p className="victory">You win! 🎉</p>}
          <FoundWords words={game.words()} />
        </aside>
        <BoardView board={game.board} onWord={addWord} disabled={won} />
      </div>
      <section className="debug">
        <h2>Debug</h2>
        <div className="controls">
          <button type="button" className="control-button" onClick={toggleSolution}>
            {solution ? 'Hide all words' : 'Show all words'}
          </button>
          <button type="button" className="control-button" onClick={clearStorage}>
            Clear storage
          </button>
        </div>
        {solution && <AllWords words={solution} />}
      </section>
    </main>
  );
}

export default App;
