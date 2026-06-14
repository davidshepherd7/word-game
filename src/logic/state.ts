import type { Board } from "./board.ts";
import { scoreWord } from "./score-word.ts";
import type { Word } from "./word-checker.ts";

class AlreadyFound {}

class State {
    readonly board: Board
    private readonly foundWords: Word[]
    private readonly foundWordText: Set<string>
    private _score: number

    constructor(board: Board) {
        this.board = board;
        this.foundWords = [];
        this.foundWordText = new Set<string>()
        this._score = 0;
    }

    addWord(word: Word): AlreadyFound | void {
        const text = word.wordText();
        if (this.foundWordText.has(text)) {
            return new AlreadyFound()
        }

        this.foundWords.push(word)
        this.foundWordText.add(text)
        this._score = this._score + scoreWord(word)
    }

    words(): readonly Word[] {
        return this.foundWords
    }

    score(): number {
        return this._score
    }
}


export {State, AlreadyFound}
