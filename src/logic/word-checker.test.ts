import { beforeAll, describe, expect, it, vi } from 'vitest';

// The word list is fetched at runtime; mock its URL and the fetch response with
// a few rows of common_words.tsv (a header plus lemma, part_of_speech,
// word_form, ...). The word is the third column; the rows include a lowercase
// entry, a padded entry, and a blank line to exercise normalization.
vi.mock('../../dictionaries/common_words.tsv?url', () => ({ default: '/dict.tsv' }));

import { Board, Letter } from './board.ts';
import { isWord, loadDictionary, parseDictionary, solve } from './word-checker.ts';

const mockTsv =
  'lemma\tpart_of_speech\tword_form\tfrequency\tlemma_frequency\tis_root_form\n' +
  'cat\tcommon noun\tcat\t5.0\t5.0\tTrue\n' +
  'dog\tcommon noun\t  dog  \t4.0\t4.0\tTrue\n' +
  '\n' +
  'at\tpreposition\tAT\t10.0\t10.0\tTrue\n' +
  'quiz\tcommon noun\tquiz\t1.0\t1.0\tTrue';

beforeAll(async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ text: async () => mockTsv })),
  );
  await loadDictionary();
});

const letters = (word: string): Letter[] => [...word].map((alpha) => new Letter(alpha));

describe('isWord', () => {
  it('accepts a word in the dictionary', () => {
    expect(isWord(letters('CAT'))).not.toBeNull();
  });

  it("returns the word's dictionary data", () => {
    const found = isWord(letters('CAT'));
    expect(found?.wordData.partOfSpeech).toBe('common noun');
    expect(found?.wordData.frequency).toBe(5.0);
    expect(found?.wordData.lemma).toBe('cat');
  });

  it('rejects a word not in the dictionary', () => {
    expect(isWord(letters('CAR'))).toBeNull();
    expect(isWord(letters('DOGE'))).toBeNull();
  });

  it('rejects words shorter than three letters', () => {
    // "AT" is in the dictionary but too short to play.
    expect(isWord(letters('AT'))).toBeNull();
  });

  it('rejects the empty word', () => {
    expect(isWord([])).toBeNull();
  });

  it('matches a lowercase dictionary entry against uppercase board letters', () => {
    expect(isWord(letters('CAT'))).not.toBeNull();
  });

  it('ignores surrounding whitespace and blank entries in the word list', () => {
    expect(isWord(letters('DOG'))).not.toBeNull();
  });
});

describe('parseDictionary', () => {
  it('skips the header row', () => {
    const words = parseDictionary(mockTsv);
    expect(words.has('CAT')).toBe(true);
    expect(words.has('WORD_FORM')).toBe(false);
  });

  it('throws if the columns are not what we assume', () => {
    expect(() => parseDictionary('word\tcount\nCAT\t5')).toThrow();
  });
});

describe('solve', () => {
  it('spells a word through a QU tile, treating it as two letters', () => {
    // QU I
    //  X Z   (QU->I->Z is a connected path spelling QUIZ)
    const board = new Board([
      [new Letter('QU'), new Letter('I')],
      [new Letter('X'), new Letter('Z')],
    ]);
    const found = solve(board).map((word) => word.wordText());
    expect(found).toContain('QUIZ');
  });
});
