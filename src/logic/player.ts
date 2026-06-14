export { Player, LevelUp };

// Cumulative experience to reach levels 2, 3 and 4. Beyond the last threshold
// the player is at the top level.
const LEVEL_THRESHOLDS = [100, 200, 350, 500, 700, 1_000, 1_400, 2_000, 3_000];

class LevelUp {}

class Player {
  experience: number;
  private _level: number;

  constructor(experience = 0) {
    this.experience = experience;
    this._level = levelForExperience(experience);
  }

  /// Add experience, returning a LevelUp only when it crosses into a new level.
  gainExperience(exp: number): LevelUp | null {
    this.experience += exp;
    const level = levelForExperience(this.experience);
    if (level === this._level) return null;
    this._level = level;
    return new LevelUp();
  }

  level(): number {
    return this._level;
  }

  /// Experience earned within the current level and the total the level spans.
  /// `needed` is null at the top level, where there is nothing further to earn.
  levelProgress(): { into: number; needed: number | null } {
    const start = LEVEL_THRESHOLDS[this._level - 2] ?? 0;
    const next = LEVEL_THRESHOLDS[this._level - 1];
    return { into: this.experience - start, needed: next === undefined ? null : next - start };
  }

  /// Progress towards the next level, from 0 to 1; a full bar at the top level.
  progressToNextLevel(): number {
    const { into, needed } = this.levelProgress();
    return needed === null ? 1 : into / needed;
  }
}

function levelForExperience(experience: number): number {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (experience < threshold) break;
    level++;
  }
  return level;
}
