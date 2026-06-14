import type { Board, Letter } from "./board.ts";
import sowpodsText from "./sowpods.txt?raw";

class Word {
    readonly letters: readonly Letter[]

    constructor(letters: readonly Letter[]) {
        this.letters = letters;
    }

    wordText(): string {
        return this.letters.map((letter) => letter.alpha).join("");
    }
}

function isWord(letters: readonly Letter[]): boolean {
    if (letters.length < 3) {
        // TODO: if dict is slowing us down we could remove all 2 letter words?
        return false
    }

    return dictionary().has(new Word(letters).wordText());
}

/// Get a list of all possible words in the board
function solve(board: Board): Word[] {
    const grid = board.grid;

    // Restrict the search to words spellable from the board's letters and build
    // a prefix index from them. The walk below still enforces the real
    // adjacency / no-reuse rules, so over-including candidates is harmless — it
    // just keeps the index small enough to prune dead branches cheaply.
    let cellCount = 0;
    const available = new Set<string>();
    for (const row of grid) {
        for (const letter of row) {
            available.add(letter.alpha);
            cellCount++;
        }
    }

    const prefixes = new Set<string>();
    for (const entry of dictionary()) {
        if (entry.length < 3 || entry.length > cellCount) continue;
        let spellable = true;
        for (let i = 0; i < entry.length; i++) {
            if (!available.has(entry[i])) {
                spellable = false;
                break;
            }
        }
        if (!spellable) continue;
        for (let end = 1; end <= entry.length; end++) {
            prefixes.add(entry.slice(0, end));
        }
    }

    const words = dictionary();
    const visited = grid.map((row) => row.map(() => false));
    const path: Letter[] = [];
    const found = new Map<string, Word>();

    const extend = (row: number, col: number, prefix: string) => {
        const text = prefix + grid[row][col].alpha;
        if (!prefixes.has(text)) return;

        visited[row][col] = true;
        path.push(grid[row][col]);

        if (text.length >= 3 && words.has(text) && !found.has(text)) {
            found.set(text, new Word([...path]));
        }

        for (let nextRow = row - 1; nextRow <= row + 1; nextRow++) {
            for (let nextCol = col - 1; nextCol <= col + 1; nextCol++) {
                if (nextRow < 0 || nextRow >= grid.length) continue;
                if (nextCol < 0 || nextCol >= grid[nextRow].length) continue;
                if (!visited[nextRow][nextCol]) extend(nextRow, nextCol, text);
            }
        }

        path.pop();
        visited[row][col] = false;
    };

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            extend(row, col, "");
        }
    }

    return [...found.values()];
}

function dictionary(): ReadonlySet<string> {
    // SOWPODS is lowercase; board letters are uppercase. Normalize to uppercase
    // so the two meet. Built once and reused.
    cached ??= new Set(
        sowpodsText.split("\n").map((line) => line.trim().toUpperCase()).filter(Boolean),
    );
    return cached;
}

let cached: ReadonlySet<string> | undefined;

export { isWord, solve, Word };
