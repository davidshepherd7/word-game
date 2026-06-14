import type { Word } from "./word-checker.ts";

function scoreWord(word: Word): number {
    // Boggle scoring: longer words are worth disproportionately more.
    const length = word.letters.length;
    if (length <= 4) return 1;
    if (length === 5) return 2;
    if (length === 6) return 3;
    if (length === 7) return 5;
    return 11;
}

export { scoreWord }
