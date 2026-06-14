import { useCallback, useState } from 'react'
import { generateBoard } from './logic/board.ts'
import { State } from './logic/state.ts'
import { isWord, solve, type Word } from './logic/word-checker.ts'
import { AllWords } from './ui/AllWords.tsx'
import { BoardView } from './ui/BoardView.tsx'
import { FoundWords } from './ui/FoundWords.tsx'
import './App.css'

function App() {
  const [state] = useState(() => new State(generateBoard(4)))
  // State mutates in place, so bump a counter to re-render after it changes.
  const [, setTick] = useState(0)
  const [solution, setSolution] = useState<readonly Word[] | null>(null)

  const addWord = useCallback(
    (word: Word) => {
      if (!isWord(word.letters)) return
      state.addWord(word)
      setTick((tick) => tick + 1)
    },
    [state],
  )

  const toggleSolution = useCallback(() => {
    setSolution((current) => (current ? null : solve(state.board)))
  }, [state])

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
      <button type="button" className="solve-button" onClick={toggleSolution}>
        {solution ? 'Hide all words' : 'Show all words'}
      </button>
      {solution && <AllWords words={solution} />}
    </main>
  )
}

export default App
