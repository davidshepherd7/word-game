import type { FoundWord } from '../logic/word-checker.ts';

export function FoundWords({ words }: { words: readonly FoundWord[] }) {
  if (words.length === 0) return null;

  const longestFirst = [...words].sort((a, b) => b.letters.length - a.letters.length);

  return (
    <section className="found-words" aria-label="Found words">
      <h2>Found {words.length}</h2>
      <ul>
        {longestFirst.map((word) => (
          <li key={word.wordText()}>{word.wordText()}</li>
        ))}
      </ul>
    </section>
  );
}
