import type { Board } from './board.ts';
import type { WinCondition } from './win-condition.ts';
import type { FoundWord } from './word-checker.ts';

class AlreadyFound {}

class Game {
  readonly board: Board;
  readonly winCondition: WinCondition;
  private readonly foundWords: FoundWord[];
  private readonly foundFoundWordText: Set<string>;

  constructor(board: Board, winCondition: WinCondition) {
    this.board = board;
    this.winCondition = winCondition;
    this.foundWords = [];
    this.foundFoundWordText = new Set<string>();
  }

  addWord(word: FoundWord): AlreadyFound | void {
    const text = word.wordText();
    if (this.foundFoundWordText.has(text)) {
      return new AlreadyFound();
    }

    this.foundWords.push(word);
    this.foundFoundWordText.add(text);
  }

  words(): readonly FoundWord[] {
    return this.foundWords;
  }

  hasWon(): boolean {
    return this.winCondition.hasWon(this.foundWords);
  }

  status(): string {
    return this.winCondition.renderStatus(this.foundWords);
  }
}

export { Game, AlreadyFound };
