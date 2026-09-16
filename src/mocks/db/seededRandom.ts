/**
 * A small deterministic random-number generator (the mulberry32 algorithm) so the seed
 * data is identical on every run — no `Math.random()`, no faker. Same seed in, same
 * sequence of "random" values out.
 */
export type SeededRandom = () => number

export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Random integer in [min, max], inclusive. */
export function randomInt(random: SeededRandom, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

/** Picks one element from a non-empty array. */
export function pick<T>(random: SeededRandom, items: readonly T[]): T {
  const item = items[randomInt(random, 0, items.length - 1)]
  if (item === undefined) {
    throw new RangeError('pick() called with an empty array')
  }
  return item
}

/** Picks one label from a list of [label, weight] pairs, weighted by `weight`. */
export function weightedPick<T extends string>(
  random: SeededRandom,
  weights: readonly [T, number][],
): T {
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total
  for (const [label, weight] of weights) {
    roll -= weight
    if (roll <= 0) {
      return label
    }
  }
  const last = weights[weights.length - 1]
  if (!last) {
    throw new RangeError('weightedPick() called with an empty weights list')
  }
  return last[0]
}

/** Random 9-digit numeric string, zero-padded, for a NUBAN serial. */
export function randomSerial9(random: SeededRandom): string {
  return String(randomInt(random, 0, 999_999_999)).padStart(9, '0')
}
