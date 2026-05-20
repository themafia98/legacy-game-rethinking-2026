// Shared memory layout — one WebAssembly.Memory page (64 KB) shared between
// WASM and JS via Float32Array / Int32Array / Uint8Array views on the same buffer.
//
//  [0..63]       Player state        (64 bytes)
//  [64..5183]    Enemy pool          (80 B × 64 slots)
//  [5184..7231]  Projectile pool     (32 B × 64 slots)
//  [7232..11327] Item pool           (16 B × 256 slots)
//  [11328..11391 Result buffer       (64 bytes, cleared each simulate() call)
//  [11392..]     Enemy staging area  (80 B × 64 slots — JS writes, WASM copies)

// ── Player (offset 0) ─────────────────────────────────────────────────────────
export const PLAYER_BASE: i32 = 0;

export const PLAYER_POS_X:       i32 = PLAYER_BASE + 0;   // f32
export const PLAYER_POS_Y:       i32 = PLAYER_BASE + 4;   // f32
export const PLAYER_HEALTH:      i32 = PLAYER_BASE + 8;   // i32
export const PLAYER_MAX_HEALTH:  i32 = PLAYER_BASE + 12;  // i32
export const PLAYER_DAMAGE:      i32 = PLAYER_BASE + 16;  // i32
export const PLAYER_SPEED:       i32 = PLAYER_BASE + 20;  // i32  px/s
export const PLAYER_POINTS:      i32 = PLAYER_BASE + 24;  // i32
export const PLAYER_KILL_COUNT:  i32 = PLAYER_BASE + 28;  // i32
export const PLAYER_THROW_COUNT: i32 = PLAYER_BASE + 32;  // i32
export const PLAYER_ALIVE:       i32 = PLAYER_BASE + 36;  // u8
export const PLAYER_DEATH_SND:   i32 = PLAYER_BASE + 37;  // u8
// [38..63] padding

// ── Enemy pool (80 B × 64, offset 64) ────────────────────────────────────────
export const ENEMY_BASE:   i32 = 64;
export const ENEMY_STRIDE: i32 = 80;
export const MAX_ENEMIES:  i32 = 64;

// Field offsets relative to enemyAddr(i)
export const EF_POS_X:        i32 = 0;   // f32
export const EF_POS_Y:        i32 = 4;   // f32
export const EF_SPEED_X:      i32 = 8;   // f32  sign encodes bounce direction
export const EF_SPEED_Y:      i32 = 12;  // f32
export const EF_HEALTH:       i32 = 16;  // i32
export const EF_MAX_HEALTH:   i32 = 20;  // i32
export const EF_DAMAGE:       i32 = 24;  // i32
export const EF_TYPE:         i32 = 28;  // u8  → ENEMY_COMMON | ENEMY_BOSS | ENEMY_BOSS_EXTRA
export const EF_ALIVE:        i32 = 29;  // u8
export const EF_ON_DEATH:     i32 = 30;  // u8  death animation active
export const EF_DEATH_DONE:   i32 = 31;  // u8
export const EF_PROJ_POS_X:   i32 = 32;  // f32  each enemy carries at most 1 projectile
export const EF_PROJ_POS_Y:   i32 = 36;  // f32
export const EF_PROJ_SPD_X:   i32 = 40;  // f32
export const EF_PROJ_SPD_Y:   i32 = 44;  // f32
export const EF_PROJ_ACTIVE:  i32 = 48;  // u8
// [49..51] padding
export const EF_PROJ_SHEET_X: i32 = 52;  // i32  sprite atlas coords for this bullet type
export const EF_PROJ_SHEET_Y: i32 = 56;  // i32
export const EF_FRAME_INDEX:  i32 = 60;  // i32  animation frame (advanced by JS renderer)
export const EF_PLAY_ONCE:    i32 = 64;  // u8
export const EF_ONCE_DONE:    i32 = 65;  // u8  all death frames shown; entity can be freed
// [66..79] padding

// ── Projectile pool (32 B × 64, offset 5184) ─────────────────────────────────
export const PROJ_BASE:       i32 = 5184;
export const PROJ_STRIDE:     i32 = 32;
export const MAX_PROJECTILES: i32 = 64;

export const PF_POS_X:  i32 = 0;   // f32
export const PF_POS_Y:  i32 = 4;   // f32
export const PF_DIR_X:  i32 = 8;   // f32  normalised direction
export const PF_DIR_Y:  i32 = 12;  // f32
export const PF_SPEED:  i32 = 16;  // i32  px/s
export const PF_ACTIVE: i32 = 20;  // u8
// [21..31] padding

// ── Item pool (16 B × 256, offset 7232) ──────────────────────────────────────
export const ITEM_BASE:   i32 = 7232;
export const ITEM_STRIDE: i32 = 16;
export const MAX_ITEMS:   i32 = 256;

export const IF_POS_X:  i32 = 0;  // f32
export const IF_POS_Y:  i32 = 4;  // f32
export const IF_TYPE:   i32 = 8;  // u8  → ITEM_COIN | ITEM_FOOD | ITEM_SCROLL
export const IF_ACTIVE: i32 = 9;  // u8
// [10..15] padding

// ── Result buffer (64 B, offset 11328) ───────────────────────────────────────
export const RESULT_BASE:         i32 = 11328;
export const RESULT_EVENT_FLAGS:  i32 = RESULT_BASE + 0;   // i32 bitfield
export const RESULT_POINTS_DELTA: i32 = RESULT_BASE + 4;   // i32
export const RESULT_HEALTH_DELTA: i32 = RESULT_BASE + 8;   // i32
export const RESULT_DAMAGE_DELTA: i32 = RESULT_BASE + 12;  // i32
export const RESULT_KILLS_DELTA:  i32 = RESULT_BASE + 16;  // i32

// ── Enemy staging area (offset 11392) ────────────────────────────────────────
export const STAGING_BASE: i32 = 11392;

// ── Entity type constants ─────────────────────────────────────────────────────
// Single source of truth — referenced by enemies.ts, combat.ts, and JS SimMemory.ts
export const ENEMY_COMMON:     u8 = 0;
export const ENEMY_BOSS:       u8 = 1;
export const ENEMY_BOSS_EXTRA: u8 = 2;

export const ITEM_COIN:   u8 = 0;
export const ITEM_FOOD:   u8 = 1;
export const ITEM_SCROLL: u8 = 2;

// ── Hitbox sizes ──────────────────────────────────────────────────────────────
// Defined once — shared by enemies.ts, combat.ts, items.ts (DRY)
export const HITBOX_ENEMY_W:  f32 = 30.0;
export const HITBOX_ENEMY_H:  f32 = 30.0;
export const HITBOX_PLAYER_W: f32 = 32.0;
export const HITBOX_PLAYER_H: f32 = 32.0;
export const HITBOX_PROJ_W:   f32 = 35.0;
export const HITBOX_PROJ_H:   f32 = 35.0;
export const HITBOX_ITEM_W:   f32 = 26.0;
export const HITBOX_ITEM_H:   f32 = 26.0;

// ── Event flag bits ───────────────────────────────────────────────────────────
export const EVT_DAMAGE:      i32 = 0x01;
export const EVT_ENEMY_DIED:  i32 = 0x02;
export const EVT_ITEM_PICKED: i32 = 0x04;
export const EVT_PLAYER_DEAD: i32 = 0x08;

// ── Input flag bits ───────────────────────────────────────────────────────────
export const INPUT_UP:    i32 = 0x01;
export const INPUT_DOWN:  i32 = 0x02;
export const INPUT_LEFT:  i32 = 0x04;
export const INPUT_RIGHT: i32 = 0x08;
export const INPUT_FIRED: i32 = 0x10;

// ── Slot address helpers ──────────────────────────────────────────────────────
// @inline folds these into a single ADD instruction at -O3

@inline export function enemyAddr(i: i32): i32 { return ENEMY_BASE + i * ENEMY_STRIDE; }
@inline export function projAddr(i: i32):  i32 { return PROJ_BASE  + i * PROJ_STRIDE;  }
@inline export function itemAddr(i: i32):  i32 { return ITEM_BASE  + i * ITEM_STRIDE;  }

// ── Field accessor helpers ────────────────────────────────────────────────────
// Eliminate repeated load/store boilerplate across modules.
// Each call inlines to a single load/store instruction at -O3.

@inline export function isEnemyAlive(base: i32): bool { return load<u8>(base + EF_ALIVE) != 0; }
@inline export function isEnemyDying(base: i32): bool { return load<u8>(base + EF_ON_DEATH) != 0; }
@inline export function isEnemyDone(base: i32):  bool { return load<u8>(base + EF_ONCE_DONE) != 0; }
@inline export function getEnemyHP(base: i32):   i32  { return load<i32>(base + EF_HEALTH); }

@inline export function isProjAlive(base: i32): bool  { return load<u8>(base + PF_ACTIVE) != 0; }
@inline export function isItemAlive(base: i32): bool  { return load<u8>(base + IF_ACTIVE) != 0; }

// OR new event bits into the result flag field — called after any game event
@inline export function emitEvent(bits: i32): void {
  store<i32>(RESULT_EVENT_FLAGS, load<i32>(RESULT_EVENT_FLAGS) | bits);
}
