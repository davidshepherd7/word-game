import type { Board, Letter } from "./board.ts";
import dictionaryUrl from "../../dictionaries/common_words.tsv?url";

export { isWord, solve, loadDictionary, parseDictionary, FoundWord, WordData };

class WordData {
    readonly lemma: string;
    readonly partOfSpeech: string;
    readonly frequency: number;
    readonly isRootForm: boolean;

    constructor(fields: {
        lemma: string;
        partOfSpeech: string;
        frequency: number;
        isRootForm: boolean;
    }) {
        this.lemma = fields.lemma;
        this.partOfSpeech = fields.partOfSpeech;
        this.frequency = fields.frequency;
        this.isRootForm = fields.isRootForm;
    }
}

class FoundWord {
    readonly letters: readonly Letter[];
    readonly wordData: WordData;

    constructor(letters: readonly Letter[], wordData: WordData) {
        this.letters = letters;
        this.wordData = wordData;
    }

    wordText(): string {
        return this.letters.map((letter) => letter.alpha).join("");
    }
}

function isWord(letters: readonly Letter[]): FoundWord | null {
    if (letters.length < 3) {
        return null
    }

    const rawWord = letters.map((letter) => letter.alpha).join("");
    const wordData = dictionary().get(rawWord);
    if (wordData == null) {
        return null
    }

    return new FoundWord(letters, wordData)
}

/// Get a list of all possible words in the board
function solve(board: Board): FoundWord[] {
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
    for (const entry of dictionary().keys()) {
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
    const found = new Map<string, FoundWord>();

    const extend = (row: number, col: number, prefix: string) => {
        const text = prefix + grid[row][col].alpha;
        if (!prefixes.has(text)) return;

        visited[row][col] = true;
        path.push(grid[row][col]);

        if (text.length >= 3 && words.has(text) && !found.has(text)) {
            found.set(text, new FoundWord([...path], words.get(text)!));
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

let cached: ReadonlyMap<string, WordData> | undefined;

function parseDictionary(text: string): Map<string, WordData> {
    const columns = [
        "lemma",
        "part_of_speech",
        "word_form",
        "frequency",
        "is_root_form",
    ];
    // Verify the header is what we assume, so a changed format fails loudly here
    // rather than silently reading words from the wrong column.
    const [header, ...rows] = text.split("\n");
    if (header !== columns.join("\t")) {
        throw new Error(`Unexpected dictionary header: "${header}"`);
    }
    const column = (name: string) => columns.indexOf(name);

    const dictionary = new Map<string, WordData>();
    for (const line of rows) {
        const fields = line.split("\t");
        const word = fields[column("word_form")]?.trim().toUpperCase();
        if (!word) continue;
        dictionary.set(
            word,
            new WordData({
                lemma: fields[column("lemma")]?.trim() ?? "",
                partOfSpeech: fields[column("part_of_speech")]?.trim() ?? "",
                frequency: Number(fields[column("frequency")]),
                isRootForm: fields[column("is_root_form")]?.trim() === "True",
            }),
        );
    }
    return dictionary;
}

// Fetch the word list once. It is large, so it is served as a separate asset
// rather than bundled into the JS; await this before calling isWord or solve.
async function loadDictionary(): Promise<void> {
    if (cached) return;
    cached = parseDictionary(await (await fetch(dictionaryUrl)).text());
}

function dictionary(): ReadonlyMap<string, WordData> {
    if (!cached) throw new Error("dictionary not loaded — await loadDictionary() first");
    return cached;
}


