import type { FoundWord } from './word-checker.ts';

export { WinCondition, WordCountWin, LongWordWin, randomWinCondition };

abstract class WinCondition {
  abstract hasWon(foundWords: readonly FoundWord[]): boolean;
  abstract renderStatus(foundWords: readonly FoundWord[]): string;
  abstract expAwarded(): number;
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

  expAwarded(): number {
    // More complex function of target, slow exponential?
    return 10;
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

  expAwarded(): number {
    // More complex function of target, fast exponential?
    return 10;
  }
}

function randomWinCondition(): WinCondition {
  const choices = [new WordCountWin(5), new LongWordWin(5)];
  return choices[Math.floor(Math.random() * choices.length)];
}
