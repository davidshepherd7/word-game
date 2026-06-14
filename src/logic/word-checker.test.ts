import { describe, expect, it, vi } from "vitest";

// Replace the bundled BNC word list with a small mock dictionary. It is a TSV
// whose third column is the word; this includes a lowercase entry, a padded
// entry, and a blank line to exercise normalization.
vi.mock("../../dictionaries/simple_bnc_dict_no_swears.tsv?raw", () => ({
    default:
        "x\tNoC\tcat\t1\t1\t0.5\t1\n" +
        "x\tNoC\t  dog  \t1\t1\t0.5\t1\n" +
        "\n" +
        "x\tNoC\tAT\t1\t1\t0.5\t1\n" +
        "x\tNoC\tquiz\t1\t1\t0.5\t1",
}));

import { Board, Letter } from "./board.ts";
import { isWord, solve } from "./word-checker.ts";

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

describe("solve", () => {
    it("spells a word through a QU tile, treating it as two letters", () => {
        // QU I
        //  X Z   (QU->I->Z is a connected path spelling QUIZ)
        const board = new Board([
            [new Letter("QU"), new Letter("I")],
            [new Letter("X"), new Letter("Z")],
        ]);
        const found = solve(board).map((word) => word.wordText());
        expect(found).toContain("QUIZ");
    });
});
