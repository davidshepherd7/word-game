import { type Codec, gameCodec, type SavedGame } from './codecs.ts';

export { storage };
export type { SavedGame };

const VERSION = 1;

const KEYS = {
  game: 'wordgame:current-game',
};

const storage = {
  loadGame: (): SavedGame | null => read(KEYS.game, gameCodec),
  saveGame: (game: SavedGame): void => write(KEYS.game, gameCodec, game),
  clearGame: (): void => remove(KEYS.game),
};

type Envelope = { version: number; data: unknown };

function read<T>(key: string, codec: Codec<T>): T | null {
  let stored: string | null;
  try {
    stored = localStorage.getItem(key);
  } catch {
    return null; // localStorage unavailable, e.g. disabled in private mode
  }
  if (stored === null) return null;
  try {
    const envelope: unknown = JSON.parse(stored);
    if (!isEnvelope(envelope)) throw new Error('not a storage envelope');
    return codec.decode(migrate(envelope));
  } catch (error) {
    // Corrupt, hand-edited, or written by an unknown version: discard rather
    // than crash, and let the caller fall back to a default.
    console.warn(`Discarding unreadable storage for "${key}"`, error);
    return null;
  }
}

function write<T>(key: string, codec: Codec<T>, value: T): void {
  const envelope: Envelope = { version: VERSION, data: codec.encode(value) };
  try {
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch (error) {
    console.warn(`Failed to persist storage for "${key}"`, error); // quota / unavailable
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Envelope).version === 'number' &&
    'data' in value
  );
}

// Bring a stored envelope up to the current schema version. As VERSION grows,
// add upgrade steps here (e.g. while (envelope.version < VERSION) …) so old
// saves migrate instead of being discarded. Today there is only one version.
function migrate(envelope: Envelope): unknown {
  if (envelope.version !== VERSION) {
    throw new Error(`unsupported storage version ${envelope.version}`);
  }
  return envelope.data;
}
