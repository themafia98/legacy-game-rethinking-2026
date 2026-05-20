import {
  MAX_ENEMIES, MAX_PROJECTILES, MAX_ITEMS,
  EF_POS_X, EF_POS_Y, EF_SPEED_X, EF_SPEED_Y,
  EF_ALIVE, EF_ON_DEATH, EF_HEALTH, EF_PROJ_ACTIVE,
  EF_FRAME_INDEX, EF_PLAY_ONCE, EF_ONCE_DONE,
  PF_POS_X, PF_POS_Y, PF_ACTIVE,
  IF_POS_X, IF_POS_Y, IF_TYPE, IF_ACTIVE,
  PLAYER_DAMAGE, PLAYER_POINTS, PLAYER_KILL_COUNT,
  RESULT_KILLS_DELTA, RESULT_POINTS_DELTA,
  ITEM_COIN, ITEM_FOOD, ITEM_SCROLL,
  HITBOX_PROJ_W, HITBOX_PROJ_H, HITBOX_ENEMY_W, HITBOX_ENEMY_H,
  EVT_ENEMY_DIED,
  isEnemyAlive, isEnemyDying, isEnemyDone, getEnemyHP, isProjAlive, emitEvent,
  enemyAddr, projAddr, itemAddr,
} from './memory';
import { testAABB } from './collision';
import { nextF32 } from './rng';

// ── Drop table ────────────────────────────────────────────────────────────────
// Coin and food are mutually exclusive (first branch); scroll is a separate roll.
const DROP_CHANCE:   f32 = 0.5;
const COIN_CHANCE:   f32 = 0.7;
const FOOD_CHANCE:   f32 = 0.5;
const SCROLL_CHANCE: f32 = 0.2;

const DEATH_POINTS: i32 = 25;

// ── Public API ────────────────────────────────────────────────────────────────

export function resolveProjectileVsEnemies(): void {
  const playerDamage = load<i32>(PLAYER_DAMAGE);

  for (let pi = 0; pi < MAX_PROJECTILES; pi++) {
    const pBase = projAddr(pi);
    if (!isProjAlive(pBase)) continue;

    const px = load<f32>(pBase + PF_POS_X);
    const py = load<f32>(pBase + PF_POS_Y);

    for (let ei = 0; ei < MAX_ENEMIES; ei++) {
      const eBase = enemyAddr(ei);
      if (!isEnemyAlive(eBase) || isEnemyDying(eBase)) continue;

      if (testAABB(px, py, HITBOX_PROJ_W, HITBOX_PROJ_H,
                   load<f32>(eBase + EF_POS_X), load<f32>(eBase + EF_POS_Y),
                   HITBOX_ENEMY_W, HITBOX_ENEMY_H)) {
        store<i32>(eBase + EF_HEALTH, getEnemyHP(eBase) - playerDamage);
        store<u8> (pBase + PF_ACTIVE, 0);
        break; // one projectile hits one enemy
      }
    }
  }
}

export function resolveEnemyDeaths(): void {
  for (let i = 0; i < MAX_ENEMIES; i++) {
    const base = enemyAddr(i);
    if (!isEnemyAlive(base)) continue;

    if (getEnemyHP(base) <= 0 && !isEnemyDying(base)) {
      startDeathAnimation(base);
      spawnDrops(base);
    }

    if (isEnemyDying(base) && isEnemyDone(base)) {
      freeEnemy(base);
    }
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

function startDeathAnimation(base: i32): void {
  store<u8> (base + EF_ON_DEATH,    1);
  store<f32>(base + EF_SPEED_X,     0.0);
  store<f32>(base + EF_SPEED_Y,     0.0);
  store<u8> (base + EF_PROJ_ACTIVE, 0);
  store<i32>(base + EF_FRAME_INDEX, 0);
  store<u8> (base + EF_PLAY_ONCE,   1);
  store<u8> (base + EF_ONCE_DONE,   0);

  store<i32>(PLAYER_KILL_COUNT,  load<i32>(PLAYER_KILL_COUNT)  + 1);
  store<i32>(RESULT_KILLS_DELTA, load<i32>(RESULT_KILLS_DELTA) + 1);
  emitEvent(EVT_ENEMY_DIED);
}

function freeEnemy(base: i32): void {
  store<u8> (base + EF_ALIVE,        0);
  store<i32>(PLAYER_POINTS,          load<i32>(PLAYER_POINTS)       + DEATH_POINTS);
  store<i32>(RESULT_POINTS_DELTA,    load<i32>(RESULT_POINTS_DELTA) + DEATH_POINTS);
}

function spawnDrops(base: i32): void {
  const x = load<f32>(base + EF_POS_X);
  const y = load<f32>(base + EF_POS_Y);

  if (nextF32() < DROP_CHANCE) {
    spawnItem(nextF32() < COIN_CHANCE ? ITEM_COIN : ITEM_FOOD, x, y);
  } else if (nextF32() < FOOD_CHANCE) {
    spawnItem(ITEM_FOOD, x, y);
  }
  if (nextF32() < SCROLL_CHANCE) {
    spawnItem(ITEM_SCROLL, x, y);
  }
}

function spawnItem(type: u8, x: f32, y: f32): void {
  for (let i = 0; i < MAX_ITEMS; i++) {
    const base = itemAddr(i);
    if (load<u8>(base + IF_ACTIVE) != 0) continue;
    store<f32>(base + IF_POS_X,  x);
    store<f32>(base + IF_POS_Y,  y);
    store<u8> (base + IF_TYPE,   type);
    store<u8> (base + IF_ACTIVE, 1);
    return;
  }
}
