import type { FoundWord } from '../logic/word-checker.ts'

export function AllWords({ words }: { words: readonly FoundWord[] }) {
  const longestFirst = [...words].sort((a, b) => b.letters.length - a.letters.length)

  return (
    <section className="all-words" aria-label="All possible words">
      <h2>All words ({words.length})</h2>
      <ul>
        {longestFirst.map((word) => (
          <li key={word.wordText()}>{word.wordText()}</li>
        ))}
      </ul>
    </section>
  )
}
