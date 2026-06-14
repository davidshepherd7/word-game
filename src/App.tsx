import { useCallback, useEffect, useState } from 'react'
import { generateBoard, type Letter } from './logic/board.ts'
import { State } from './logic/state.ts'
import { isWord, loadDictionary, solve, type FoundWord } from './logic/word-checker.ts'
import { storage } from './storage/storage.ts'
import { AllWords } from './ui/AllWords.tsx'
import { BoardView } from './ui/BoardView.tsx'
import { FoundWords } from './ui/FoundWords.tsx'
import './App.css'

function newGame(): State {
  const state = new State(generateBoard(4))
  // Persist the fresh board immediately so a reload before the first word
  // restores this board rather than generating a different one.
  storage.saveGame({ board: state.board, words: [] })
  return state
}

function restoreGame(): State {
  // Decoding the saved words re-runs isWord, so the dictionary must already be
  // loaded by the time this is called.
  const saved = storage.loadGame()
  if (!saved) return newGame()
  const state = new State(saved.board)
  saved.words.forEach((word) => state.addWord(word))
  return state
}

function App() {
  // Null until the dictionary has loaded and the game has been restored.
  const [state, setState] = useState<State | null>(null)
  // State mutates in place, so bump a counter to re-render after it changes.
  const [, setTick] = useState(0)
  const [solution, setSolution] = useState<readonly FoundWord[] | null>(null)

  useEffect(() => {
    loadDictionary()
      .then(() => setState(restoreGame()))
      .catch((error) => console.error(error))
  }, [])

  const addWord = useCallback(
    (letters: readonly Letter[]) => {
      if (!state) return
      const found = isWord(letters)
      if (!found) return
      state.addWord(found)
      storage.saveGame({ board: state.board, words: state.words() })
      setTick((tick) => tick + 1)
    },
    [state],
  )

  const startNewGame = useCallback(() => {
    setState(newGame())
    setSolution(null)
  }, [])

  const toggleSolution = useCallback(() => {
    if (!state) return
    setSolution((current) => (current ? null : solve(state.board)))
  }, [state])

  if (!state) {
    return (
      <main className="game">
        <h1>Word Game</h1>
        <p className="score">Loading dictionary…</p>
      </main>
    )
  }

  return (
    <main className="game">
      <h1>Word Game</h1>
      <div className="play-area">
        <aside className="sidebar">
          <p className="score">Score {state.score()}</p>
          <FoundWords words={state.words()} />
        </aside>
        <BoardView board={state.board} onWord={addWord} />
      </div>
      <div className="controls">
        <button type="button" className="control-button" onClick={startNewGame}>
          New game
        </button>
        <button type="button" className="control-button" onClick={toggleSolution}>
          {solution ? 'Hide all words' : 'Show all words'}
        </button>
      </div>
      {solution && <AllWords words={solution} />}
    </main>
  )
}

export default App
