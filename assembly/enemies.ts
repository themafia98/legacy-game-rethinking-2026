import {
  MAX_ENEMIES,
  EF_POS_X, EF_POS_Y, EF_SPEED_X, EF_SPEED_Y, EF_DAMAGE,
  EF_TYPE, EF_PROJ_POS_X, EF_PROJ_POS_Y, EF_PROJ_SPD_X, EF_PROJ_SPD_Y,
  EF_PROJ_ACTIVE, EF_PROJ_SHEET_X, EF_PROJ_SHEET_Y,
  PLAYER_POS_X, PLAYER_POS_Y, PLAYER_HEALTH,
  ENEMY_BOSS, ENEMY_BOSS_EXTRA,
  HITBOX_ENEMY_W, HITBOX_ENEMY_H, HITBOX_PLAYER_W, HITBOX_PLAYER_H,
  EVT_DAMAGE,
  isEnemyAlive, isEnemyDying, emitEvent,
  enemyAddr,
} from './memory';
import { testAABB } from './collision';
import { randomSign, randomSpeedScale } from './rng';

// ── Arena bounce walls ────────────────────────────────────────────────────────
const BOUNCE_LEFT:   f32 = 70.0;
const BOUNCE_RIGHT:  f32 = 700.0;
const BOUNCE_TOP:    f32 = 70.0;
const BOUNCE_BOTTOM: f32 = 400.0;

// ── Enemy bullet bounds (cull when out of arena) ──────────────────────────────
const BULLET_LEFT:   f32 = 40.0;
const BULLET_RIGHT:  f32 = 755.0;
const BULLET_TOP:    f32 = 60.0;
const BULLET_BOTTOM: f32 = 440.0;

const BULLET_SPEED: f32 = 150.0;
// Fixed step keeps bullet speed frame-rate-independent (rAF dt varies; this doesn't).
const BULLET_DT:    f32 = 0.016;

// ── Sprite atlas coords per enemy bullet type ─────────────────────────────────
const SHEET_COMMON_X: i32 = 324;  const SHEET_COMMON_Y: i32 = 0;
const SHEET_BOSS_X:   i32 = 192;  const SHEET_BOSS_Y:   i32 = 2;
const SHEET_BOSSEX_X: i32 = 354;  const SHEET_BOSSEX_Y: i32 = 2;

// ── Damage cooldown ───────────────────────────────────────────────────────────
// Prevents a single overlap from draining multiple HP per rendered frame.
let lastDamageTime: f32 = -9999.0;
const DAMAGE_COOLDOWN: f32 = 200.0;

// ── Public API ────────────────────────────────────────────────────────────────

export function updateEnemies(now: f32): void {
  const playerX = load<f32>(PLAYER_POS_X);
  const playerY = load<f32>(PLAYER_POS_Y);

  for (let i = 0; i < MAX_ENEMIES; i++) {
    const base = enemyAddr(i);
    if (!isEnemyAlive(base) || isEnemyDying(base)) continue;

    bounceAndMove(base);
    tickBullet(base, playerX, playerY, now);
    checkBodyContact(base, playerX, playerY, now);
  }
}

export function resetEnemyTimers(): void {
  lastDamageTime = -9999.0;
}

export function getAliveEnemyCount(): i32 {
  let n: i32 = 0;
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (isEnemyAlive(enemyAddr(i))) n++;
  }
  return n;
}

// ── Private helpers ───────────────────────────────────────────────────────────

function bounceAndMove(base: i32): void {
  let sx = load<f32>(base + EF_SPEED_X);
  let sy = load<f32>(base + EF_SPEED_Y);
  let x  = load<f32>(base + EF_POS_X);
  let y  = load<f32>(base + EF_POS_Y);

  if (x > BOUNCE_RIGHT || x < BOUNCE_LEFT)  sx = -sx;
  if (y > BOUNCE_BOTTOM || y < BOUNCE_TOP)  sy = -sy;

  store<f32>(base + EF_POS_X,   x + sx);
  store<f32>(base + EF_POS_Y,   y + sy);
  store<f32>(base + EF_SPEED_X, sx);
  store<f32>(base + EF_SPEED_Y, sy);
}

function tickBullet(base: i32, playerX: f32, playerY: f32, now: f32): void {
  if (load<u8>(base + EF_PROJ_ACTIVE) == 0) {
    spawnBullet(base);
  } else {
    moveBullet(base, playerX, playerY, now);
  }
}

function spawnBullet(base: i32): void {
  const x    = load<f32>(base + EF_POS_X);
  const y    = load<f32>(base + EF_POS_Y);
  const type = load<u8>(base + EF_TYPE);

  store<f32>(base + EF_PROJ_POS_X,   x);
  store<f32>(base + EF_PROJ_POS_Y,   y);
  store<f32>(base + EF_PROJ_SPD_X,   BULLET_SPEED * randomSign() * randomSpeedScale());
  store<f32>(base + EF_PROJ_SPD_Y,   BULLET_SPEED);
  store<i32>(base + EF_PROJ_SHEET_X, bulletAtlasX(type));
  store<i32>(base + EF_PROJ_SHEET_Y, bulletAtlasY(type));
  store<u8> (base + EF_PROJ_ACTIVE,  1);
}

function moveBullet(base: i32, playerX: f32, playerY: f32, now: f32): void {
  const bx = load<f32>(base + EF_PROJ_POS_X) + load<f32>(base + EF_PROJ_SPD_X) * BULLET_DT;
  const by = load<f32>(base + EF_PROJ_POS_Y) + load<f32>(base + EF_PROJ_SPD_Y) * BULLET_DT;

  if (isOutOfArena(bx, by)) {
    deactivateBullet(base);
    return;
  }

  store<f32>(base + EF_PROJ_POS_X, bx);
  store<f32>(base + EF_PROJ_POS_Y, by);

  if (testAABB(bx, by, HITBOX_ENEMY_W, HITBOX_ENEMY_H, playerX, playerY, HITBOX_PLAYER_W, HITBOX_PLAYER_H)) {
    applyDamage(load<i32>(base + EF_DAMAGE), now);
    deactivateBullet(base);
  }
}

function checkBodyContact(base: i32, playerX: f32, playerY: f32, now: f32): void {
  const x = load<f32>(base + EF_POS_X);
  const y = load<f32>(base + EF_POS_Y);
  if (testAABB(x, y, HITBOX_ENEMY_W, HITBOX_ENEMY_H, playerX, playerY, HITBOX_PLAYER_W, HITBOX_PLAYER_H)) {
    applyDamage(load<i32>(base + EF_DAMAGE), now);
  }
}

function applyDamage(damage: i32, now: f32): void {
  if (now - lastDamageTime <= DAMAGE_COOLDOWN) return;
  lastDamageTime = now;

  const hp = load<i32>(PLAYER_HEALTH);
  if (hp > 0) {
    store<i32>(PLAYER_HEALTH, max(0, hp - damage));
    emitEvent(EVT_DAMAGE);
  }
}

@inline
function deactivateBullet(base: i32): void {
  store<u8> (base + EF_PROJ_ACTIVE, 0);
  store<f32>(base + EF_PROJ_POS_X,  load<f32>(base + EF_POS_X));
  store<f32>(base + EF_PROJ_POS_Y,  load<f32>(base + EF_POS_Y));
}

@inline
function isOutOfArena(x: f32, y: f32): bool {
  return x < BULLET_LEFT || x > BULLET_RIGHT || y < BULLET_TOP || y > BULLET_BOTTOM;
}

@inline
function bulletAtlasX(type: u8): i32 {
  if (type == ENEMY_BOSS)       return SHEET_BOSS_X;
  if (type == ENEMY_BOSS_EXTRA) return SHEET_BOSSEX_X;
  return SHEET_COMMON_X;
}

@inline
function bulletAtlasY(type: u8): i32 {
  if (type == ENEMY_BOSS)       return SHEET_BOSS_Y;
  if (type == ENEMY_BOSS_EXTRA) return SHEET_BOSSEX_Y;
  return SHEET_COMMON_Y;
}
