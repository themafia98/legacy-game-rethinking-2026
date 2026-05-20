import {
  MAX_ENEMIES, MAX_PROJECTILES, MAX_ITEMS,
  EF_POS_X, EF_POS_Y, EF_ALIVE, EF_ON_DEATH,
  EF_SPEED_X, EF_SPEED_Y, EF_PROJ_ACTIVE,
  EF_HEALTH, EF_FRAME_INDEX, EF_PLAY_ONCE, EF_ONCE_DONE,
  PF_POS_X, PF_POS_Y, PF_ACTIVE,
  IF_POS_X, IF_POS_Y, IF_TYPE, IF_ACTIVE,
  PLAYER_DAMAGE, PLAYER_POINTS, PLAYER_KILL_COUNT,
  RESULT_EVENT_FLAGS, RESULT_KILLS_DELTA, RESULT_POINTS_DELTA,
  EVT_ENEMY_DIED,
  enemyAddr, projAddr, itemAddr,
} from './memory';
import { testAABB } from './collision';
import { nextF32 } from './rng';

const ITEM_COIN:   u8 = 0;
const ITEM_FOOD:   u8 = 1;
const ITEM_SCROLL: u8 = 2;

// Drop table: coin/food are mutually exclusive; scroll is an independent roll.
const DROP_CHANCE:   f32 = 0.5;
const COIN_CHANCE:   f32 = 0.7;
const FOOD_CHANCE:   f32 = 0.5;
const SCROLL_CHANCE: f32 = 0.2;

const ENEMY_DEATH_POINTS: i32 = 25;

const PROJ_HIT_W:  f32 = 35.0;
const PROJ_HIT_H:  f32 = 35.0;
const ENEMY_HIT_W: f32 = 30.0;
const ENEMY_HIT_H: f32 = 30.0;

export function resolveProjectileVsEnemies(): void {
  const playerDamage: i32 = load<i32>(PLAYER_DAMAGE);

  for (let pi = 0; pi < MAX_PROJECTILES; pi++) {
    const pBase = projAddr(pi);
    if (load<u8>(pBase + PF_ACTIVE) == 0) continue;

    const px: f32 = load<f32>(pBase + PF_POS_X);
    const py: f32 = load<f32>(pBase + PF_POS_Y);

    for (let ei = 0; ei < MAX_ENEMIES; ei++) {
      const eBase = enemyAddr(ei);
      if (load<u8>(eBase + EF_ALIVE)    == 0) continue;
      if (load<u8>(eBase + EF_ON_DEATH) != 0) continue;

      if (testAABB(px, py, PROJ_HIT_W, PROJ_HIT_H,
                   load<f32>(eBase + EF_POS_X), load<f32>(eBase + EF_POS_Y),
                   ENEMY_HIT_W, ENEMY_HIT_H)) {
        store<i32>(eBase + EF_HEALTH, load<i32>(eBase + EF_HEALTH) - playerDamage);
        store<u8> (pBase + PF_ACTIVE, 0);
        break;
      }
    }
  }
}

export function resolveEnemyDeaths(): void {
  for (let i = 0; i < MAX_ENEMIES; i++) {
    const base = enemyAddr(i);
    if (load<u8>(base + EF_ALIVE) == 0) continue;

    if (load<i32>(base + EF_HEALTH) <= 0 && load<u8>(base + EF_ON_DEATH) == 0) {
      store<u8> (base + EF_ON_DEATH,    1);
      store<f32>(base + EF_SPEED_X,     0.0);
      store<f32>(base + EF_SPEED_Y,     0.0);
      store<u8> (base + EF_PROJ_ACTIVE, 0);
      store<i32>(base + EF_FRAME_INDEX, 0);
      store<u8> (base + EF_PLAY_ONCE,   1);
      store<u8> (base + EF_ONCE_DONE,   0);

      store<i32>(PLAYER_KILL_COUNT,   load<i32>(PLAYER_KILL_COUNT)   + 1);
      store<i32>(RESULT_KILLS_DELTA,  load<i32>(RESULT_KILLS_DELTA)  + 1);
      store<i32>(RESULT_EVENT_FLAGS,  load<i32>(RESULT_EVENT_FLAGS)  | EVT_ENEMY_DIED);

      spawnDrops(base);
    }

    // Free slot and award points once death animation finishes.
    if (load<u8>(base + EF_ON_DEATH) != 0 && load<u8>(base + EF_ONCE_DONE) != 0) {
      store<u8> (base + EF_ALIVE,        0);
      store<i32>(PLAYER_POINTS,          load<i32>(PLAYER_POINTS)         + ENEMY_DEATH_POINTS);
      store<i32>(RESULT_POINTS_DELTA,    load<i32>(RESULT_POINTS_DELTA)   + ENEMY_DEATH_POINTS);
    }
  }
}

function spawnDrops(enemyBase: i32): void {
  const ex: f32 = load<f32>(enemyBase + EF_POS_X);
  const ey: f32 = load<f32>(enemyBase + EF_POS_Y);

  if (nextF32() < DROP_CHANCE) {
    spawnItem(nextF32() < COIN_CHANCE ? ITEM_COIN : ITEM_FOOD, ex, ey);
  } else if (nextF32() < FOOD_CHANCE) {
    spawnItem(ITEM_FOOD, ex, ey);
  }
  if (nextF32() < SCROLL_CHANCE) {
    spawnItem(ITEM_SCROLL, ex, ey);
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
