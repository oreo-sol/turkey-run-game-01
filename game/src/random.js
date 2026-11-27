// Gobble Dash — a tiny seeded random source, so a screenshot seed always
// replays the same run and the game stays fair without feeling fixed.
export function makeRng(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return {
    /** Next float in [0, 1). */
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    },
    /** Integer in [min, max]. */
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    /** Float in [min, max). */
    range(min, max) {
      return min + this.next() * (max - min);
    },
    /** Pick one entry of `list`. */
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    },
    /** True with probability `p`. */
    chance(p) {
      return this.next() < p;
    },
  };
}
