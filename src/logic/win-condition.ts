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
    return Math.ceil((this.target / 3) ** 2);
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

  renderStatus(_foundWords: readonly FoundWord[]): string {
    return `find a ${this.minLength} letter word`;
  }

  expAwarded(): number {
    return 4 ** (this.minLength - 3);
  }
}

function randomChoice<T>(choices: T[]): T {
  return choices[Math.floor(Math.random() * choices.length)];
}

function randomWinCondition(): WinCondition {
  const choices = [
    new WordCountWin(randomChoice([3, 5, 8, 12, 15])),
    new LongWordWin(randomChoice([4, 5, 6, 7])),
  ];
  return randomChoice(choices);
}
