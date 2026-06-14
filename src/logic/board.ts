class Letter {
    readonly alpha: string;

    constructor(alpha: string) {
        assert(isUpper(alpha))
        this.alpha = alpha;
    }
}

class Board {
    readonly grid: readonly Letter[][];

    constructor(grid: Letter[][]) {
        this.grid = grid
    }
}

class BoardLocation {
    readonly col: number
    readonly row: number

    constructor(col: number, row: number) {
        this.col = col;
        this.row = row;
    }
}

function generateBoard(size: number): Board {
    const grid: Letter[][] = [];
    for (let row = 0; row < size; row++) {
        const cells: Letter[] = [];
        for (let col = 0; col < size; col++) {
            cells.push(new Letter(randomLetter()));
        }
        grid.push(cells);
    }
    return new Board(grid);
}

/// Extract the ordered string of letters at these locations in the board
function boardWord(board: Board, locations: BoardLocation[]): Letter[] {
    return locations.map(({ col, row }) => board.grid[row][col]);
}

function randomLetter(): string {
    // Weight by English letter frequency (Scrabble tile counts) rather than
    // picking uniformly, so boards have enough vowels and common consonants to
    // spell words and rare letters stay rare. The Q tile is the "QU" digraph (as
    // in Boggle), so a Q always brings its U.
    const frequencies: Record<string, number> = {
        A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9,
        J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, QU: 1, R: 6,
        S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1,
    };

    const total = Object.values(frequencies).reduce((sum, weight) => sum + weight, 0);
    let pick = Math.floor(Math.random() * total);
    for (const [letter, weight] of Object.entries(frequencies)) {
        pick -= weight;
        if (pick < 0) {
            return letter;
        }
    }
    return "E"; // unreachable: pick < total, so the loop always returns
}

function isUpper(text: string): boolean {
    return text !== text.toLowerCase() && text === text.toUpperCase();
}

function assert(condition: unknown, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

export { Board, BoardLocation, Letter, boardWord, generateBoard }
