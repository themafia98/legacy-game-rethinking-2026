// Xorshift32 (Marsaglia 2003) — replaces Math.random() which is unavailable in WASM.
// Period: 2^32 − 1. Seeded from JS via performance.now() on startup.

let state: u32 = 2463534242;

export function seedRng(seed: u32): void {
  state = seed != 0 ? seed : 2463534242;
}

export function nextU32(): u32 {
  state ^= state << 13;
  state ^= state >> 17;
  state ^= state << 5;
  return state;
}

@inline export function nextF32(): f32     { return f32(nextU32()) / f32(0xFFFFFFFF); }
@inline export function randomSign(): f32  { return (nextU32() & 1) == 0 ? -1.0 : 1.0; }
@inline export function randomSpeedScale(): f32 { return (nextU32() & 1) == 0 ? 1.0 : 1.2; }
