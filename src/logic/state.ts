import type { Board } from './board.ts';
import { scoreFoundWord } from './score-word.ts';
import type { FoundWord } from './word-checker.ts';

class AlreadyFound {}

class State {
  readonly board: Board;
  private readonly foundWords: FoundWord[];
  private readonly foundFoundWordText: Set<string>;
  private _score: number;

  constructor(board: Board) {
    this.board = board;
    this.foundWords = [];
    this.foundFoundWordText = new Set<string>();
    this._score = 0;
  }

  addWord(word: FoundWord): AlreadyFound | void {
    const text = word.wordText();
    if (this.foundFoundWordText.has(text)) {
      return new AlreadyFound();
    }

    this.foundWords.push(word);
    this.foundFoundWordText.add(text);
    this._score = this._score + scoreFoundWord(word);
  }

  words(): readonly FoundWord[] {
    return this.foundWords;
  }

  score(): number {
    return this._score;
  }
}

export { State, AlreadyFound };
