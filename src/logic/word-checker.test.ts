import { describe, expect, it, vi } from "vitest";

// Replace the bundled SOWPODS word list with a small mock dictionary. Includes a
// lowercase entry, a padded entry, and a blank line to exercise normalization.
vi.mock("./sowpods.txt?raw", () => ({ default: "cat\n  dog  \n\nAT" }));

import { Letter } from "./board.ts";
import { isWord } from "./word-checker.ts";

const letters = (word: string): Letter[] => [...word].map((alpha) => new Letter(alpha));

describe("isWord", () => {
    it("accepts a word in the dictionary", () => {
        expect(isWord(letters("CAT"))).toBe(true);
    });

    it("rejects a word not in the dictionary", () => {
        expect(isWord(letters("CAR"))).toBe(false);
        expect(isWord(letters("DOGE"))).toBe(false);
    });

    it("rejects words shorter than three letters", () => {
        // "AT" is in the dictionary but too short to play.
        expect(isWord(letters("AT"))).toBe(false);
    });

    it("rejects the empty word", () => {
        expect(isWord([])).toBe(false);
    });

    it("matches a lowercase dictionary entry against uppercase board letters", () => {
        expect(isWord(letters("CAT"))).toBe(true);
    });

    it("ignores surrounding whitespace and blank entries in the word list", () => {
        expect(isWord(letters("DOG"))).toBe(true);
    });
});
