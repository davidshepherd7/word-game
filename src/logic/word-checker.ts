import type { Board, Letter } from "./board.ts";
import dictionaryUrl from "../../dictionaries/common_words.tsv?url";

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
    let availableChars = 0;
    const available = new Set<string>();
    for (const row of grid) {
        for (const letter of row) {
            // A tile's alpha may be a digraph ("QU"), so index its characters.
            for (const char of letter.alpha) available.add(char);
            availableChars += letter.alpha.length;
        }
    }

    const prefixes = new Set<string>();
    for (const entry of dictionary()) {
        if (entry.length < 3 || entry.length > availableChars) continue;
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

let cached: ReadonlySet<string> | undefined;

function parseDictionary(text: string): Set<string> {
    const columns = [
        "lemma",
        "part_of_speech",
        "word_form",
        "frequency",
        "range",
        "dispersion",
        "is_root_form",
    ];
    // Verify the header is what we assume, so a changed format fails loudly here
    // rather than silently reading words from the wrong column.
    const [header, ...rows] = text.split("\n");
    if (header !== columns.join("\t")) {
        throw new Error(`Unexpected dictionary header: "${header}"`);
    }
    const wordColumn = columns.indexOf("word_form");
    return new Set(
        rows
            .map((line) => line.split("\t")[wordColumn]?.trim().toUpperCase())
            .filter((word): word is string => Boolean(word)),
    );
}

// Fetch the word list once. It is large, so it is served as a separate asset
// rather than bundled into the JS; await this before calling isWord or solve.
async function loadDictionary(): Promise<void> {
    if (cached) return;
    cached = parseDictionary(await (await fetch(dictionaryUrl)).text());
}

function dictionary(): ReadonlySet<string> {
    if (!cached) throw new Error("dictionary not loaded — await loadDictionary() first");
    return cached;
}

export { isWord, loadDictionary, parseDictionary, solve, Word };
