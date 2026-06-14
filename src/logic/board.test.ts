import { describe, expect, it } from "vitest";
import { Board, BoardLocation, Letter, boardWord, generateBoard } from "./board.ts";

describe("Letter", () => {
    it("stores its character", () => {
        expect(new Letter("Q").alpha).toBe("Q");
    });

    it("rejects a non-uppercase character", () => {
        expect(() => new Letter("q")).toThrow();
        expect(() => new Letter("1")).toThrow();
    });
});

describe("Board", () => {
    it("stores the grid it was built from", () => {
        const grid = [[new Letter("A"), new Letter("B")]];
        expect(new Board(grid).grid).toBe(grid);
    });
});

describe("generateBoard", () => {
    it("produces a square grid of the requested size", () => {
        for (const size of [1, 2, 4, 7]) {
            const board = generateBoard(size);
            expect(board.grid).toHaveLength(size);
            for (const row of board.grid) {
                expect(row).toHaveLength(size);
            }
        }
    });

    it("fills every cell with a single uppercase letter", () => {
        for (const row of generateBoard(5).grid) {
            for (const cell of row) {
                expect(cell).toBeInstanceOf(Letter);
                expect(cell.alpha).toMatch(/^[A-Z]$/);
            }
        }
    });

    it("returns an empty board for size 0 instead of throwing", () => {
        expect(generateBoard(0).grid).toEqual([]);
    });
});

describe("boardWord", () => {
    // C A T
    // D O G
    const board = new Board([
        [new Letter("C"), new Letter("A"), new Letter("T")],
        [new Letter("D"), new Letter("O"), new Letter("G")],
    ]);
    const word = (locations: BoardLocation[]) =>
        boardWord(board, locations).map((letter) => letter.alpha).join("");

    it("reads the letters along the path in order", () => {
        const path = [new BoardLocation(0, 0), new BoardLocation(1, 0), new BoardLocation(2, 0)];
        expect(word(path)).toBe("CAT");
    });

    it("locates each cell by column then row", () => {
        const path = [new BoardLocation(1, 0), new BoardLocation(1, 1), new BoardLocation(2, 1)];
        expect(word(path)).toBe("AOG");
    });

    it("returns no letters for an empty path", () => {
        expect(boardWord(board, [])).toEqual([]);
    });
});
