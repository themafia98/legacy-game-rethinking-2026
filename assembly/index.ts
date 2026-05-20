// WASM module entry point.
// Lifecycle: seedRng() once → initPlayer() + initEnemies() per wave → simulate() per frame.

import {
  PLAYER_ALIVE, PLAYER_HEALTH, PLAYER_DEATH_SND,
  PLAYER_POS_X, PLAYER_POS_Y,
  PLAYER_DAMAGE, PLAYER_SPEED,
  PLAYER_POINTS, PLAYER_KILL_COUNT, PLAYER_THROW_COUNT, PLAYER_MAX_HEALTH,
  ENEMY_STRIDE, MAX_ENEMIES, MAX_ITEMS,
  EF_ALIVE, EF_ON_DEATH, EF_DEATH_DONE,
  EF_PROJ_ACTIVE, EF_FRAME_INDEX, EF_PLAY_ONCE, EF_ONCE_DONE,
  IF_ACTIVE,
  RESULT_EVENT_FLAGS,
  RESULT_POINTS_DELTA, RESULT_HEALTH_DELTA, RESULT_DAMAGE_DELTA, RESULT_KILLS_DELTA,
  STAGING_BASE,
  EVT_PLAYER_DEAD,
  enemyAddr, itemAddr,
} from './memory';

import { seedRng as _seedRng }                                                      from './rng';
import { updatePlayer }                                                             from './player';
import { updateProjectiles, tryFireProjectile, resetProjectiles,
         getActiveProjectileCount as _getActiveProjectileCount }                    from './projectiles';
import { updateEnemies, getAliveEnemyCount as _getAliveEnemyCount,
         resetEnemyTimers }                                                         from './enemies';
import { resolveProjectileVsEnemies, resolveEnemyDeaths }                          from './combat';
import { updateItems, getActiveItemCount as _getActiveItemCount }                   from './items';

export function seedRng(seed: u32): void { _seedRng(seed); }

export function initPlayer(posX: f32, posY: f32, health: i32, damage: i32, speed: i32): void {
  store<f32>(PLAYER_POS_X,       posX);
  store<f32>(PLAYER_POS_Y,       posY);
  store<i32>(PLAYER_HEALTH,      health);
  store<i32>(PLAYER_MAX_HEALTH,  health);
  store<i32>(PLAYER_DAMAGE,      damage);
  store<i32>(PLAYER_SPEED,       speed);
  store<i32>(PLAYER_POINTS,      0);
  store<i32>(PLAYER_KILL_COUNT,  0);
  store<i32>(PLAYER_THROW_COUNT, 0);
  store<u8> (PLAYER_ALIVE,       1);
  store<u8> (PLAYER_DEATH_SND,   0);
}

// JS pre-fills the staging area via SimMemory.writeEnemyStaging(), then calls this.
// WASM copies staging → active pool via memory.copy() — no JS objects cross the boundary.
export function initEnemies(count: i32): void {
  for (let i = 0; i < MAX_ENEMIES; i++) store<u8>(enemyAddr(i) + EF_ALIVE, 0);
  resetProjectiles();
  for (let i = 0; i < MAX_ITEMS; i++) store<u8>(itemAddr(i) + IF_ACTIVE, 0);
  resetEnemyTimers();

  const n: i32 = min(count, MAX_ENEMIES);
  for (let i = 0; i < n; i++) {
    const dst = enemyAddr(i);
    memory.copy(dst, STAGING_BASE + i * ENEMY_STRIDE, ENEMY_STRIDE);
    store<u8> (dst + EF_ALIVE,       1);
    store<u8> (dst + EF_ON_DEATH,    0);
    store<u8> (dst + EF_DEATH_DONE,  0);
    store<u8> (dst + EF_PROJ_ACTIVE, 0);
    store<i32>(dst + EF_FRAME_INDEX, 0);
    store<u8> (dst + EF_PLAY_ONCE,   0);
    store<u8> (dst + EF_ONCE_DONE,   0);
  }
}

// Called once per requestAnimationFrame. Pipeline order is intentional:
// player position must be updated before projectile firing, damage resolved last.
export function simulate(inputFlags: i32, mouseX: f32, mouseY: f32, dt: f32, now: f32): void {
  store<i32>(RESULT_EVENT_FLAGS,  0);
  store<i32>(RESULT_POINTS_DELTA, 0);
  store<i32>(RESULT_HEALTH_DELTA, 0);
  store<i32>(RESULT_DAMAGE_DELTA, 0);
  store<i32>(RESULT_KILLS_DELTA,  0);

  if (load<u8>(PLAYER_ALIVE) == 0) return;

  updatePlayer(inputFlags, dt);
  tryFireProjectile(inputFlags, mouseX, mouseY, now);
  updateProjectiles(dt);
  updateEnemies(now);
  resolveProjectileVsEnemies();
  resolveEnemyDeaths();
  updateItems();

  if (load<i32>(PLAYER_HEALTH) <= 0 && load<u8>(PLAYER_ALIVE) != 0) {
    store<u8> (PLAYER_ALIVE, 0);
    store<i32>(RESULT_EVENT_FLAGS, load<i32>(RESULT_EVENT_FLAGS) | EVT_PLAYER_DEAD);
  }
}

export function getAliveEnemyCount(): i32       { return _getAliveEnemyCount(); }
export function getActiveProjectileCount(): i32 { return _getActiveProjectileCount(); }
export function getActiveItemCount(): i32       { return _getActiveItemCount(); }

// Called from JS renderer — animation frame is driven by rendered ticks, not simulate().
export function advanceDeathFrame(i: i32): void {
  const base = enemyAddr(i);
  if (load<u8>(base + EF_ON_DEATH)  == 0) return;
  if (load<u8>(base + EF_ONCE_DONE) != 0) return;
  const fi: i32 = load<i32>(base + EF_FRAME_INDEX) + 1;
  store<i32>(base + EF_FRAME_INDEX, fi);
  if (fi >= 3) store<u8>(base + EF_ONCE_DONE, 1);
}
