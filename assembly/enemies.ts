import {
  MAX_ENEMIES,
  EF_POS_X, EF_POS_Y, EF_SPEED_X, EF_SPEED_Y,
  EF_ALIVE, EF_ON_DEATH, EF_TYPE, EF_DAMAGE,
  EF_PROJ_POS_X, EF_PROJ_POS_Y, EF_PROJ_SPD_X, EF_PROJ_SPD_Y,
  EF_PROJ_ACTIVE, EF_PROJ_SHEET_X, EF_PROJ_SHEET_Y,
  PLAYER_POS_X, PLAYER_POS_Y, PLAYER_HEALTH,
  RESULT_EVENT_FLAGS,
  EVT_DAMAGE,
  enemyAddr,
} from './memory';
import { testAABB } from './collision';
import { randomSign, randomSpeedScale } from './rng';

const BOUNCE_LEFT:   f32 = 70.0;
const BOUNCE_RIGHT:  f32 = 700.0;
const BOUNCE_TOP:    f32 = 70.0;
const BOUNCE_BOTTOM: f32 = 400.0;

const EBULLET_LEFT:   f32 = 40.0;
const EBULLET_RIGHT:  f32 = 755.0;
const EBULLET_TOP:    f32 = 60.0;
const EBULLET_BOTTOM: f32 = 440.0;

const ENEMY_PROJ_SPEED: f32 = 150.0;
// Fixed step keeps enemy bullet speed constant regardless of rAF delta variance.
const ENEMY_PROJ_DT: f32 = 0.016;

const ENEMY_HIT_W:  f32 = 30.0;
const ENEMY_HIT_H:  f32 = 30.0;
const PLAYER_HIT_W: f32 = 32.0;
const PLAYER_HIT_H: f32 = 32.0;

const SHEET_BULLET_COMMON_X: i32 = 324;  const SHEET_BULLET_COMMON_Y: i32 = 0;
const SHEET_BULLET_BOSS_X:   i32 = 192;  const SHEET_BULLET_BOSS_Y:   i32 = 2;
const SHEET_BULLET_BOSSEX_X: i32 = 354;  const SHEET_BULLET_BOSSEX_Y: i32 = 2;

// Prevents a single overlap frame from draining the whole health bar.
let lastDamageSoundTime: f32 = -9999.0;
const DAMAGE_COOLDOWN_MS: f32 = 200.0;

export function updateEnemies(now: f32): void {
  const playerX: f32 = load<f32>(PLAYER_POS_X);
  const playerY: f32 = load<f32>(PLAYER_POS_Y);

  for (let i = 0; i < MAX_ENEMIES; i++) {
    const base = enemyAddr(i);
    if (load<u8>(base + EF_ALIVE)    == 0) continue;
    if (load<u8>(base + EF_ON_DEATH) != 0) continue;

    let sx: f32 = load<f32>(base + EF_SPEED_X);
    let sy: f32 = load<f32>(base + EF_SPEED_Y);
    let x:  f32 = load<f32>(base + EF_POS_X);
    let y:  f32 = load<f32>(base + EF_POS_Y);

    if (x > BOUNCE_RIGHT || x < BOUNCE_LEFT)  sx = -sx;
    if (y > BOUNCE_BOTTOM || y < BOUNCE_TOP)  sy = -sy;

    x += sx;
    y += sy;

    store<f32>(base + EF_POS_X,   x);
    store<f32>(base + EF_POS_Y,   y);
    store<f32>(base + EF_SPEED_X, sx);
    store<f32>(base + EF_SPEED_Y, sy);

    const dmg: i32 = load<i32>(base + EF_DAMAGE);

    if (load<u8>(base + EF_PROJ_ACTIVE) == 0) {
      const eType: u8 = load<u8>(base + EF_TYPE);
      let shX: i32 = SHEET_BULLET_COMMON_X;
      let shY: i32 = SHEET_BULLET_COMMON_Y;
      if (eType == 1) { shX = SHEET_BULLET_BOSS_X;   shY = SHEET_BULLET_BOSS_Y; }
      if (eType == 2) { shX = SHEET_BULLET_BOSSEX_X; shY = SHEET_BULLET_BOSSEX_Y; }

      store<f32>(base + EF_PROJ_POS_X, x);
      store<f32>(base + EF_PROJ_POS_Y, y);
      store<f32>(base + EF_PROJ_SPD_X, ENEMY_PROJ_SPEED * randomSign() * randomSpeedScale());
      store<f32>(base + EF_PROJ_SPD_Y, ENEMY_PROJ_SPEED);
      store<i32>(base + EF_PROJ_SHEET_X, shX);
      store<i32>(base + EF_PROJ_SHEET_Y, shY);
      store<u8> (base + EF_PROJ_ACTIVE, 1);
    } else {
      const px: f32 = load<f32>(base + EF_PROJ_POS_X) + load<f32>(base + EF_PROJ_SPD_X) * ENEMY_PROJ_DT;
      const py: f32 = load<f32>(base + EF_PROJ_POS_Y) + load<f32>(base + EF_PROJ_SPD_Y) * ENEMY_PROJ_DT;

      if (px < EBULLET_LEFT || px > EBULLET_RIGHT || py < EBULLET_TOP || py > EBULLET_BOTTOM) {
        store<u8> (base + EF_PROJ_ACTIVE, 0);
        store<f32>(base + EF_PROJ_POS_X, x);
        store<f32>(base + EF_PROJ_POS_Y, y);
      } else {
        store<f32>(base + EF_PROJ_POS_X, px);
        store<f32>(base + EF_PROJ_POS_Y, py);

        if (testAABB(px, py, ENEMY_HIT_W, ENEMY_HIT_H, playerX, playerY, PLAYER_HIT_W, PLAYER_HIT_H)) {
          applyDamageToPlayer(dmg, now);
          store<u8> (base + EF_PROJ_ACTIVE, 0);
          store<f32>(base + EF_PROJ_POS_X, x);
          store<f32>(base + EF_PROJ_POS_Y, y);
        }
      }
    }

    if (testAABB(x, y, ENEMY_HIT_W, ENEMY_HIT_H, playerX, playerY, PLAYER_HIT_W, PLAYER_HIT_H)) {
      applyDamageToPlayer(dmg, now);
    }
  }
}

function applyDamageToPlayer(damage: i32, now: f32): void {
  if (now - lastDamageSoundTime <= DAMAGE_COOLDOWN_MS) return;
  lastDamageSoundTime = now;

  const cur: i32 = load<i32>(PLAYER_HEALTH);
  if (cur > 0) {
    store<i32>(PLAYER_HEALTH, max(0, cur - damage));
    store<i32>(RESULT_EVENT_FLAGS, load<i32>(RESULT_EVENT_FLAGS) | EVT_DAMAGE);
  }
}

export function resetEnemyTimers(): void {
  lastDamageSoundTime = -9999.0;
}

export function getAliveEnemyCount(): i32 {
  let count: i32 = 0;
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (load<u8>(enemyAddr(i) + EF_ALIVE) != 0) count++;
  }
  return count;
}
