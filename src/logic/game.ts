import { generateBoard, type Board } from './board.ts';
import { randomWinCondition, type WinCondition } from './win-condition.ts';
import { solve, type FoundWord } from './word-checker.ts';

class AlreadyFound {}

class Game {
  readonly board: Board;
  readonly solution: FoundWord[];
  readonly winCondition: WinCondition;
  private readonly foundWords: FoundWord[];
  private readonly foundFoundWordText: Set<string>;

  constructor(board: Board, solution: FoundWord[], winCondition: WinCondition) {
    this.board = board;
    this.solution = solution;
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

function generateGame(): Game {
  const winCondition = randomWinCondition();

  // TODO would be nice to prove to the typecheckr that these are never null after the loop.

  // Try 5 boards to find a winnable one
  let board, solution;
  for (let _ of [1, 2, 3, 4, 5]) {
    board = generateBoard(4);
    solution = solve(board);

    if (winCondition.hasWon(solution)) {
      break;
    }
  }

  if (!winCondition.hasWon(solution!)) {
    // TODO: make this never happen? Change condition?
    throw Error('Failed to find winnable board');
  }

  const game = new Game(board!, solution!, winCondition);

  return game;
}

export { Game, generateGame, AlreadyFound };
