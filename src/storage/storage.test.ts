import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// The word codec re-validates saved words against the dictionary, so mock it
// the same way word-checker's own tests do.
vi.mock('../../dictionaries/common_words.tsv?url', () => ({ default: '/dict.tsv' }));

import { Board, Letter } from '../logic/board.ts';
import { WinCondition, WordCountWin } from '../logic/win-condition.ts';
import { isWord, loadDictionary } from '../logic/word-checker.ts';
import { gameCodec } from './codecs.ts';
import { storage } from './storage.ts';

const mockTsv =
  'lemma\tpart_of_speech\tword_form\tfrequency\tlemma_frequency\tis_root_form\n' +
  'cat\tcommon noun\tcat\t5.0\t5.0\tTrue\n' +
  'dog\tcommon noun\tdog\t4.0\t4.0\tTrue\n';

function mockLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

const letters = (word: string): Letter[] => [...word].map((alpha) => new Letter(alpha));
const sampleBoard = () =>
  new Board([
    [new Letter('C'), new Letter('A')],
    [new Letter('T'), new Letter('S')],
  ]);
const sampleWin = (): WinCondition => new WordCountWin(5);

beforeAll(async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ text: async () => mockTsv })),
  );
  await loadDictionary();
});

beforeEach(() => {
  vi.stubGlobal('localStorage', mockLocalStorage());
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('game persistence', () => {
  it('round-trips a board, its found words, and the win condition', () => {
    const game = {
      board: sampleBoard(),
      words: [isWord(letters('CAT'))!],
      winCondition: sampleWin(),
    };
    storage.saveGame(game);

    const loaded = storage.loadGame();
    expect(loaded?.board.grid.map((row) => row.map((l) => l.alpha))).toEqual([
      ['C', 'A'],
      ['T', 'S'],
    ]);
    expect(loaded?.words.map((w) => w.wordText())).toEqual(['CAT']);
    expect(loaded?.winCondition).toBeInstanceOf(WordCountWin);
    expect((loaded?.winCondition as WordCountWin).target).toBe(5);
  });

  it('re-attaches dictionary data to loaded words', () => {
    storage.saveGame({
      board: sampleBoard(),
      words: [isWord(letters('CAT'))!],
      winCondition: sampleWin(),
    });
    expect(storage.loadGame()?.words[0].wordData.frequency).toBe(5.0);
  });

  it('drops saved words the dictionary no longer knows', () => {
    const decoded = gameCodec.decode({
      grid: [
        ['C', 'A'],
        ['T', 'S'],
      ],
      words: [
        ['C', 'A', 'T'],
        ['X', 'Y', 'Z'],
      ],
      winCondition: { type: 'wordCount', target: 5 },
    });
    expect(decoded.words.map((w) => w.wordText())).toEqual(['CAT']);
  });

  it('returns null when nothing is stored', () => {
    expect(storage.loadGame()).toBeNull();
  });

  it('clears a saved game', () => {
    storage.saveGame({ board: sampleBoard(), words: [], winCondition: sampleWin() });
    storage.clearGame();
    expect(storage.loadGame()).toBeNull();
  });
});

describe('defensive reads', () => {
  it('discards non-JSON data', () => {
    localStorage.setItem('wordgame:current-game', 'not json at all');
    expect(storage.loadGame()).toBeNull();
  });

  it('discards an envelope with an unknown version', () => {
    localStorage.setItem(
      'wordgame:current-game',
      JSON.stringify({ version: 999, data: { grid: [], words: [] } }),
    );
    expect(storage.loadGame()).toBeNull();
  });

  it('discards data that fails codec validation', () => {
    localStorage.setItem(
      'wordgame:current-game',
      JSON.stringify({ version: 1, data: { grid: 'not a grid', words: [] } }),
    );
    expect(storage.loadGame()).toBeNull();
  });

  it('does not throw when localStorage rejects a write (e.g. quota)', () => {
    vi.stubGlobal('localStorage', {
      ...mockLocalStorage(),
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(() =>
      storage.saveGame({ board: sampleBoard(), words: [], winCondition: sampleWin() }),
    ).not.toThrow();
  });
});
