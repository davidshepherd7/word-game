import type { FoundWord } from './word-checker.ts';

export { WinCondition, WordCountWin, LongWordWin, randomWinCondition };

abstract class WinCondition {
  abstract hasWon(foundWords: readonly FoundWord[]): boolean;
  abstract renderStatus(foundWords: readonly FoundWord[]): string;
}

class WordCountWin extends WinCondition {
  readonly target: number;

  constructor(target: number) {
    super();
    this.target = target;
  }

  hasWon(foundWords: readonly FoundWord[]): boolean {
    return foundWords.length >= this.target;
  }

  renderStatus(foundWords: readonly FoundWord[]): string {
    return `${Math.min(foundWords.length, this.target)}/${this.target} words`;
  }
}

class LongWordWin extends WinCondition {
  readonly minLength: number;

  constructor(minLength: number) {
    super();
    this.minLength = minLength;
  }

  hasWon(foundWords: readonly FoundWord[]): boolean {
    return foundWords.some((word) => word.letters.length >= this.minLength);
  }

  renderStatus(foundWords: readonly FoundWord[]): string {
    const longest = foundWords.reduce((max, word) => Math.max(max, word.letters.length), 0);
    return `longest ${longest}/${this.minLength} letters`;
  }
}

function randomWinCondition(): WinCondition {
  const choices = [new WordCountWin(5), new LongWordWin(5)];
  return choices[Math.floor(Math.random() * choices.length)];
}
