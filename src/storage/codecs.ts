import { Board, Letter } from '../logic/board.ts'
import { FoundWord, isWord } from '../logic/word-checker.ts'

export { gameCodec }
export type { Codec, SavedGame }

// A pair of pure functions between a domain value and its JSON-safe wire form.
// decode validates and throws on anything it does not recognise, so a caller
// reading untrusted storage can treat a throw as "discard this".
type Codec<T> = {
  encode(value: T): unknown
  decode(raw: unknown): T
}

type SavedGame = { board: Board; words: readonly FoundWord[] }

const gameCodec: Codec<SavedGame> = {
  encode: ({ board, words }) => ({
    grid: board.grid.map((row) => row.map((letter) => letter.alpha)),
    words: words.map((word) => word.letters.map((letter) => letter.alpha)),
  }),
  decode: (raw) => {
    const dto = asRecord(raw)
    const grid = asStringMatrix(dto.grid)
    const words = asStringMatrix(dto.words)
    // new Letter() asserts uppercase, so a corrupt tile throws here.
    const board = new Board(grid.map((row) => row.map((alpha) => new Letter(alpha))))
    // The dictionary is the authority on words: re-running isWord both
    // validates each saved word and re-attaches its WordData. Words the
    // dictionary no longer knows are silently dropped rather than rejecting
    // the whole save.
    const found = words
      .map((letters) => isWord(letters.map((alpha) => new Letter(alpha))))
      .filter((word): word is FoundWord => word !== null)
    return { board, words: found }
  },
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('expected an object')
  }
  return value as Record<string, unknown>
}

function asStringMatrix(value: unknown): string[][] {
  if (
    !Array.isArray(value) ||
    !value.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === 'string'))
  ) {
    throw new Error('expected string[][]')
  }
  return value as string[][]
}

